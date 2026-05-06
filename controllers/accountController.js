const NibssServices = require("../services/nibssServices");
const catchAsync = require("../utils/catchAsync");

exports.nameEnquiry = catchAsync(async (req, res) => {
  const { accountNumber } = req.params;

  const result = await NibssServices.nameEnquiry(accountNumber);

  return res.status(200).json({
    status: "success",
    data: result,
  });
});

exports.accounts = catchAsync(async (req, res) => {
  const result = await NibssServices.getAllAccounts();

  return res.status(200).json({
    status: "succes",
    data: result,
  });
});

exports.getBalance = catchAsync(async (req, res) => {
  const { accountNumber } = req.params;

  const result = await NibssServices.getBalance(accountNumber);

  return res.status(200).json({
    status: "succes",
    data: result,
  });
});
