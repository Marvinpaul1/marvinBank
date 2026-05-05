const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    // Store full response from NIBSS
    nibssResponse: {
      type: Object,
    },
    kycType: {
      type: String,
      required: [true, "KYC type is required"],
      enum: ["bvn", "nin"],
    },

    kycID: {
      type: String,
      required: [true, "KYC ID (BVN) is required"],
    },

    dob: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    // === NEW FIELDS ===
    accountNumber: {
      type: String,
      unique: true,
      sparse: true, // ← Very important
      index: true,
    },

    accountName: {
      type: String,
    },

    bankCode: {
      type: String,
    },

    status: {
      type: String,
      enum: ["active", "inactive", "frozen"],
      default: "active",
    },
    balance: {
      type: Number,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// Optional: Compound index for better query performance
accountSchema.index({ kycType: 1, kycID: 1 });

const Account = mongoose.model("Account", accountSchema);
module.exports = Account;
