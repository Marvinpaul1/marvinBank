const NibssServices = require("../services/nibssServices");
const catchAsync = require("../utils/catchAsync");

exports.validateBvn = catchAsync(async (req, res) => {
  const { bvn } = req.body;

  const result = await NibssServices.validateBvn(bvn);

  return res.status(200).json({
    status: "success",
    data: result,
  });
});
