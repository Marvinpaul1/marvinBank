exports.welcomeEmail = (user) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f4f7f9; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; line-height: 1.6; color: #333; }
        .button { 
          display: inline-block; 
          background: #4F46E5; 
          color: white; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 6px; 
          margin: 20px 0;
        }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Marvin Bank! 🎉</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${user.firstName} ${user.lastName}</strong>,</p>
          
          <p>Thank you for joining Marvin Bank. Your account has been successfully created.</p>
          
          <p><strong>Your Account Details:</strong></p>
          <ul>
            <li><strong>Account Number:</strong> ${newUser.account?.accountNumber}</li>
            <li><strong>Email:</strong> ${user.email}</li>
            <li><strong>Phone:</strong> ${newUser.phone}</li>
          </ul>

          <p>You're now part of a new generation of banking.</p>
          
          <a href="https://yourbank.com/login" class="button">Login to Your Account</a>
          
          <p>If you have any questions, feel free to reach out to our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Marvin Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.passwordResetEmail = ({ firstName, resetURL }) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f7fa;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #4F46E5, #6366F1);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .content {
          padding: 40px 30px;
          color: #333;
        }
        .button {
          display: inline-block;
          background: #4F46E5;
          color: white;
          padding: 16px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          margin: 25px 0;
          box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
        }
        .footer {
          text-align: center;
          padding: 25px;
          color: #777;
          font-size: 14px;
          border-top: 1px solid #eee;
        }
        .warning {
          background: #FEF3C7;
          color: #92400E;
          padding: 15px;
          border-radius: 6px;
          font-size: 14px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi <strong>${firstName}</strong>,</p>
          
          <p>You requested to reset your password for your Marvin Bank account.</p>
          
          <p>Click the button below to set a new password:</p>
          
          <a href="${resetURL}" class="button">Reset Password</a>
          
          <div class="warning">
            <strong>Note:</strong> This link will expire in 10 minutes for security reasons.
            <p>After resetting your password, you will be automatically logged in.</p>
          </div>
          
          <p>If you didn't request a password reset, please ignore this email or contact support immediately.</p>
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Marvin Bank. All Rights Reserved.</p>
          <p>This is an automated message. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

exports.transferDebitEmail = ({
  firstName,
  amount,
  recipientName,
  accountNumber,
  reference,
  newBalance,
}) => `
  <h2>Debit Alert</h2>
  <p>Hi ${firstName},</p>
  <p>Your account has been debited:</p>
  <ul>
    <li><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</li>
    <li><strong>To:</strong> ${recipientName} (${accountNumber})</li>
    <li><strong>Reference:</strong> ${reference}</li>
    <li><strong>New Balance:</strong> ₦${Number(newBalance).toLocaleString()}</li>
  </ul>
  <p>If you did not authorize this, contact support immediately.</p>
`;

exports.transferCreditEmail = ({
  firstName,
  amount,
  senderName,
  reference,
  newBalance,
}) => `
  <h2>Credit Alert</h2>
  <p>Hi ${firstName},</p>
  <p>Your account has been credited:</p>
  <ul>
    <li><strong>Amount:</strong> ₦${Number(amount).toLocaleString()}</li>
    <li><strong>From:</strong> ${senderName}</li>
    <li><strong>Reference:</strong> ${reference}</li>
    <li><strong>New Balance:</strong> ₦${Number(newBalance).toLocaleString()}</li>
  </ul>
`;
