const mongoose = require("mongoose");
const { validate } = require("uuid");
const validator = require("validator");

const ninSchema = new mongoose.Schema({
  nin: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: [true, "First name is required"],
  },
  lastName: {
    type: String,
    required: true,
  },
  dob: {
    type: Date,
    require: true,
  },
});

const Nin = mongoose.model("Nin", ninSchema);

module.exports = Nin;
