const express = require("express");
const catchAsync = require("../utils/catchAsync");
const axios = require("axios");

const fintechOnboard = catchAsync(async (req, res, next) => {
  const { name, email } = req.body;

  try {
    const response = await axios.post(
      "https://nibssbyphoenix.onrender.com/api/fintech/onboard",
      { name, email },
    );

    return res.status(200).json({
      status: "success",
      data: response.data,
    });
  } catch (err) {
    console.log("NIBSS FULL ERROR:", err.response?.data);

    return res.status(400).json({
      status: "fail",
      message: err.response?.data?.message || "Onboarding failed",
      error: err.response?.data,
    });
  }
});

module.exports = fintechOnboard;
