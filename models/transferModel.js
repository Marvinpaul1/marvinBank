const mongoose = require("mongoose");
const crypto = require("crypto");

const transferSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },

    toAccountNumber: {
      type: String,
    },
    toAccountName: String,
    toBankName: String,

    amount: {
      type: Number,
      required: true,
      min: 10,
    },

    narration: {
      type: String,
      maxlength: 200,
    },

    reference: {
      type: String,
      unique: true,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },

    rawResponse: Object,
    failureReason: String,
  },
  { timestamps: true },
);

// Auto-generate reference
transferSchema.pre("save", function () {
  if (!this.reference) {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.reference = `MRV-${date}-${random}`;
  }
});

const Transfer = mongoose.model("Transfer", transferSchema);
module.exports = Transfer;
