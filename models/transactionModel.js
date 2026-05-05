const mongoose = require("mongoose");

const transactionStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ["success", "fail", "pending"],
    default: "pending",
  },
  amount: {
    type: Number,
  },
  fromAccount: {
    type: String,
  },
  toAccount: {
    type: String,
  },
  type: {
    type: String,
    enum: ["debit", "credit"],
  },
  refrence: String,

  rawResponse: Object,
  timestamp: Date,
});

const Transaction = mongoose.model("Transaction", transactionStatusSchema);

module.exports = Transaction;
