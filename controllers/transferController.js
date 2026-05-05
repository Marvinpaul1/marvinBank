const crypto = require("crypto");
const Transfer = require("../models/transferModel");
const User = require("../models/userModel");
const NibssService = require("../services/nibssServices");
const catchAsync = require("../utils/catchAsync");
const { sendEmail } = require("../utils/email");
const Account = require("../models/acountModel");

// ─── Constants ────────────────────────────────────────────────────────────────
const DAILY_TRANSFER_LIMIT =
  Number(process.env.DAILY_TRANSFER_LIMIT) || 1_000_000;
const MIN_TRANSFER_AMOUNT = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateReference = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `MRV-${date}-${random}`;
};

const getDailyTotal = async (userId) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await Transfer.aggregate([
    {
      $match: {
        from: userId,
        status: "SUCCESS",
        timestamp: { $gte: startOfDay },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  return result[0]?.total || 0;
};

// ─── Shared Pre-transfer Checks ───────────────────────────────────────────────

const runPreTransferChecks = async ({ sender, amount, pin }) => {
  // 1. Validate amount
  if (!amount || amount < MIN_TRANSFER_AMOUNT) {
    return { error: `Minimum transfer amount is ₦${MIN_TRANSFER_AMOUNT}` };
  }

  // 2. Verify PIN
  const isPinCorrect = await sender.correctPin(String(pin));
  if (!isPinCorrect) {
    return { error: "Incorrect PIN. Please try again." };
  }

  // 3. Check balance
  if (sender.balance < amount) {
    return {
      error: `Insufficient balance. Available: ₦${sender.balance.toLocaleString()}`,
    };
  }

  // 4. Check daily limit
  const dailyTotal = await getDailyTotal(sender._id);
  if (dailyTotal + amount > DAILY_TRANSFER_LIMIT) {
    const remaining = DAILY_TRANSFER_LIMIT - dailyTotal;
    return {
      error: `Daily limit exceeded. You can transfer ₦${remaining.toLocaleString()} more today.`,
    };
  }

  return { error: null };
};

// ─── INTERNAL TRANSFER ────────────────────────────────────────────────────────
// POST /api/v1/transfers/internal
// Body: { toAccountNumber, amount, pin }

exports.internalTransfer = catchAsync(async (req, res) => {
  const { toAccountNumber, amount, pin } = req.body;

  if (!toAccountNumber || !amount || !pin) {
    return res.status(400).json({
      status: "fail",
      message: "Please provide toAccountNumber, amount and PIN",
    });
  }

  // Load sender with sensitive fields
  const sender = await User.findById(req.user._id).select(
    "+pin +balance +accountNumber",
  );

  const senderAccount = await Account.findOne({ user: sender._id });
  console.log("senderAcount:", senderAccount.balance);
  // 1. Name enquiry — confirms recipient account exists on NIBSS
  let recipientInfo;
  try {
    recipientInfo = await NibssService.nameEnquiry(toAccountNumber);
  } catch (err) {
    return res.status(404).json({
      status: "fail",
      message: `Recipient not found: ${err.message}`,
    });
  }

  // 2. Prevent self-transfer
  if (sender.accountNumber === toAccountNumber) {
    return res.status(400).json({
      status: "failed",
      message: "You cannot transfer to your own account",
    });
  }

  // 3. Run shared checks (PIN, balance, daily limit)
  const { error } = await runPreTransferChecks({ sender, amount, pin });
  if (error) {
    return res.status(400).json({ status: "fail", message: error });
  }

  const reference = generateReference();
  console.log("senderAccount:", senderAccount);
  console.log("senderAccount.accountNumber:", senderAccount.accountNumber);
  console.log("Transfer payload:", {
    from: senderAccount.accountNumber,
    to: toAccountNumber,
    amount,
  });
  // 4. Execute via NIBSS
  let nibssResult;
  try {
    nibssResult = await NibssService.transfer({
      from: senderAccount.accountNumber,
      to: toAccountNumber,
      amount,
    });
  } catch (err) {
    // Record failed attempt
    await Transfer.create({
      from: sender._id,
      amount,
      currency: "NGN",
      status: "failed",
      reference,
      rawResponse: { error: err.message, toAccountNumber },
      timestamp: new Date(),
    });

    return res.status(400).json({
      status: "failed",
      message: `Transfer failed: ${err.message}`,
      reference,
    });
  }

  // 5. Debit sender locally after NIBSS confirms success
  const updatedAccount = await Account.findOneAndUpdate(
    sender.account,
    { $inc: { balance: -amount } },
    { new: true }, // VERY IMPORTANT
  );

  if (!updatedAccount) {
    throw new Error("Failed to update account balance");
  }

  // 6. Record successful transfer
  const transfer = await Transfer.create({
    from: sender._id,
    amount,
    currency: "NGN",
    status: "success",
    reference,
    rawResponse: nibssResult,
    timestamp: new Date(),
  });

  // 7. Send debit alert (non-blocking)
  sendEmail("transferDebit", sender, {
    amount,
    recipientName: recipientInfo.accountName,
    accountNumber: toAccountNumber,
    bankName: recipientInfo.bankName,
    reference,
    newBalance: updatedAccount.balance,
    transactionId: nibssResult.reference,
  }).catch(() => {});

  return res.status(200).json({
    status: "success",
    message: "Transfer successful",
    data: {
      reference: transfer.reference,
      transactionId: nibssResult.reference,
      amount,
      recipient: recipientInfo.accountName,
      recipientAccount: toAccountNumber,
      recipientBank: recipientInfo.bankName,
      newBalance: updatedAccount.balance,
      timestamp: transfer.timestamp,
    },
  });
});

// ─── EXTERNAL TRANSFER ────────────────────────────────────────────────────────
// POST /api/v1/transfers/external
// Body: { toAccountNumber, amount, pin, narration }

exports.externalTransfer = catchAsync(async (req, res) => {
  const { toAccountNumber, amount, pin, narration } = req.body;

  if (!toAccountNumber || !amount || !pin) {
    return res.status(400).json({
      status: "failed",
      message: "Please provide toAccountNumber, amount and PIN",
    });
  }

  const sender = await User.findById(req.user._id).select(
    "+pin +balance +accountNumber",
  );

  // 1. Name enquiry — must always verify recipient before transfer
  let recipientInfo;
  try {
    recipientInfo = await NibssService.nameEnquiry(toAccountNumber);
  } catch (err) {
    return res.status(404).json({
      status: "failed",
      message: `Recipient account not found: ${err.message}`,
    });
  }

  // 2. Run shared checks (PIN, balance, daily limit)
  const { error } = await runPreTransferChecks({ sender, amount, pin });
  if (error) {
    return res.status(400).json({ status: "fail", message: error });
  }

  const reference = generateReference();

  // 3. Create PENDING record before hitting NIBSS
  const transfer = await Transfer.create({
    from: sender._id,
    amount,
    currency: "NGN",
    status: "pending",
    reference,
    rawResponse: { toAccountNumber, narration },
    timestamp: new Date(),
  });

  // 4. Execute transfer via NIBSS
  let nibssResult;
  try {
    nibssResult = await NibssService.transfer({
      from: sender.accountNumber,
      to: toAccountNumber,
      amount,
    });
  } catch (err) {
    // Update transfer to FAIL
    await Transfer.findByIdAndUpdate(transfer._id, {
      status: "failed",
      rawResponse: { error: err.message, toAccountNumber, narration },
    });

    return res.status(400).json({
      status: "failed",
      message: `Transfer failed: ${err.message}`,
      reference,
    });
  }

  // 5. Debit sender only after NIBSS confirms
  const senderAccount = await Account.findOnedAndUpdate(
    sender.account,
    { $inc: { balance: -amount } },
    { new: true }, // VERY IMPORTANT
  );

  if (!senderAccount) {
    throw new Error("Insufficient balance or update failed");
  }

  // 6. Update transfer to SUCCESS with NIBSS response
  await Transfer.findByIdAndUpdate(transfer._id, {
    status: "success",
    rawResponse: nibssResult,
    newBalance: senderAccount.balance - amount,
  });

  // 7. Send debit alert (non-blocking)
  sendEmail("transferDebit", sender, {
    amount,
    recipientName: recipientInfo.accountName,
    accountNumber: toAccountNumber,
    bankName: recipientInfo.bankName,
    reference,
    newBalance: senderAccount.balance,
    transactionId: nibssResult.reference,
    narration,
  }).catch(() => {});

  return res.status(200).json({
    status: "success",
    message: "External transfer successful",
    data: {
      reference,
      transactionId: nibssResult.reference,
      amount,
      recipient: recipientInfo.accountName,
      recipientAccount: toAccountNumber,
      recipientBank: recipientInfo.bankName,
      newBalance: senderAccount.balance,
      narration,
      timestamp: new Date(),
    },
  });
});

// ─── NAME ENQUIRY ─────────────────────────────────────────────────────────────
// GET /api/v1/transfers/name-enquiry/:accountNumber

exports.nameEnquiry = catchAsync(async (req, res) => {
  const { accountNumber } = req.params;

  const result = await NibssService.nameEnquiry(accountNumber);

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

// ─── TRANSACTION STATUS (TSQ) ─────────────────────────────────────────────────
// GET /api/v1/transfers/status/:transactionId

exports.getTransactionStatus = catchAsync(async (req, res) => {
  const result = await NibssService.getTransactionStatus(
    req.params.transactionId,
  );

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

// ─── TRANSFER HISTORY ─────────────────────────────────────────────────────────
// GET /api/v1/transfers/history?page=1&limit=10&status=SUCCESS

exports.getTransferHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (page - 1) * limit;

  const filter = { from: req.user._id };
  if (status) filter.status = status.toUpperCase();

  const [transfers, total] = await Promise.all([
    Transfer.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Transfer.countDocuments(filter),
  ]);

  return res.status(200).json({
    status: "success",
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: Number(page),
    results: transfers.length,
    data: { transfers },
  });
});

// ─── SINGLE TRANSFER BY REFERENCE ────────────────────────────────────────────
// GET /api/v1/transfers/:reference

exports.getTransfer = catchAsync(async (req, res) => {
  const transfer = await Transfer.findOne({
    reference: req.params.reference,
    from: req.user._id,
  });

  if (!transfer) {
    return res.status(404).json({
      status: "failed",
      message: "Transfer record not found",
    });
  }

  return res.status(200).json({
    status: "success",
    data: { transfer },
  });
});
