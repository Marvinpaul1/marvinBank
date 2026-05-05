const mongoose = require("mongoose");

const bvnSchema = new mongoose.Schema({
  bvn: {
    type: String,
    required: [true, "BVN is required"],
    unique: true,
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
  },
  dob: {
    type: Date,
    required: [true, "Date of birth is required"],
  },
  phone: {
    type: String,
    required: [true, "Phone number is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Bvn = mongoose.model("Bvn", bvnSchema);
module.exports = Bvn;
