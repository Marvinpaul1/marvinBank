const Nin = require("../models/ninModel");
const NibssServices = require("../services/nibssServices");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.insertNin = catchAsync(async (req, res, next) => {
  const { nin, firstName, lastName, dob, phone } = req.body;

  if (!nin) {
    return res.status(400).json({
      status: "fail",
      message: "NIN is required",
    });
  }

  const ninPayload = { nin, firstName, lastName, dob, phone };

  const ninResponse = await NibssServices.insertNin(ninPayload);
  await Nin.create(ninPayload);

  res.status(201).json({
    status: "success",
    data: {
      ninResponse,
    },
  });
});

exports.validateNin = catchAsync(async (req, res) => {
  const { nin } = req.body;

  if (!nin) {
    return res.status(400).json({
      status: "fail",
      message: "NIN is required",
    });
  }

  try {
    const ninResponse = await NibssServices.validateNin(nin);

    return res.status(200).json({
      status: "success",
      data: ninResponse,
    });
  } catch (err) {
    console.log("NIBSS FULL ERROR:", err.response?.data);

    return res.status(400).json({
      status: "fail",
      message: err.response?.data?.message || "Nin validation failed",
      error: err.response?.data,
    });
  }
});
