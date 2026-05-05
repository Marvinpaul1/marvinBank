const nodemailer = require("nodemailer");
const {
  welcomeEmail,
  passwordResetEmail,
  transferCreditEmail,
  transferDebitEmail,
} = require("./emailTemplates");

// exports.sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });
//   const info = await transporter.sendMail({
//     from: process.env.EMAIL_FROM,
//     to,
//     subject,
//     html,
//   });
// };

// This is the function to send email using mailtrap for testing purposes, you can replace it with the above function to use Gmail or any other email service in production

// Map of email types → { subject, template function }
const EMAIL_TYPES = {
  welcome: {
    subject: "Welcome to Marvin Bank! 🎉",
    template: (data) => welcomeEmail(data),
  },
  passwordReset: {
    subject: "Reset your Marvin Bank password",
    template: (data) => passwordResetEmail(data),
  },
  otp: {
    subject: "Your Marvin Bank verification code",
    template: (data) => otpEmail(data),
  },
  transferDebit: {
    subject: "Your account has been debited",
    template: (data) => transferDebitEmail(data),
  },
  transferCredit: {
    subject: "Your account has been credited",
    template: (data) => transferCreditEmail(data),
  },
};

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_TEST_HOST,
    port: process.env.EMAIL_TEST_PORT,
    auth: {
      user: process.env.EMAIL_TEST_USERNAME,
      pass: process.env.EMAIL_TEST_PASSWORD,
    },
    secure: false,
  });

exports.sendEmail = async (emailType, user, extraData = {}) => {
  try {
    const emailConfig = EMAIL_TYPES[emailType];

    if (!emailConfig) {
      throw new Error(`Unknown email type: "${emailType}"`);
    }

    const transporter = createTransporter();

    // Merge user + any extra data (accountNumber, OTP, resetLink, etc.)
    const templateData = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      ...extraData,
    };

    const emailHtml = emailConfig.template(templateData);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: emailConfig.subject,
      html: emailHtml,
    });

    console.log(`✅ [${emailType}] email sent to ${user.email}`);
  } catch (error) {
    console.error(`❌ [${emailType}] email failed:`, error.message);
    // Don't crash the calling process
  }
};
