const {
  reconstructFieldPath,
} = require("express-validator/lib/field-selection");
const AppError = require("../utils/appError");

const castErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const duplicateFieldDB = (err) => {
  const messageData = err.message || err.errmsg;
  const value = messageData.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}, please use another value`;
  return new AppError(message, 400);
};

const validationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const JWTError = () => {
  return new AppError("Invalid token. Please log in again", 401);
};

const expiredJWTError = () => {
  return new AppError("Your token has expired. Please login again", 401);
};

// Send the Error in Development
const devError = (err, res) => {
  res.status(err.statuscode || 500).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send Production Error
const prodError = (err, req, res) => {
  // Operational error: send error message to client
  if (err.isOperational) {
    res.status(err.statuscode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    //  Programing error or others: don't send error details to client
    console.error("ERROR 💥", err);
    res.status(500).json({
      status: "error",
      message: "Something went wrong",
    });
  }

  // Send Querry Message
};

module.exports = (err, req, res, next) => {
  err.statuscode = err.statuscode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    devError(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = Object.assign({}, err, {
      message: err.message,
      name: err.name,
    });

    if (error.name === "CastError") error = castErrorDB(error);
    if (error.code === 11000) error = duplicateFieldDB(error);
    if (error.name === "ValidationError") error = validationErrorDB(error);
    if (error.name === "JsonWebTokenError") error = JWTError();
    if (error.name === "TokenExpiredError") error = expiredJWTError();

    prodError(error, req, res);
  }
};
