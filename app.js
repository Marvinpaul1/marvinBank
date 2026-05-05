const express = require("express");
const morgan = require("morgan");
const hpp = require("hpp");
const cors = require("cors");

const helmet = require("helmet");
const monogoSanitize = require("express-mongo-sanitize");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");

// Routes imports
const nibssRoute = require("./routes/nibssRoute");
// const authTokenRoute = require("./routes/authTokenRoute");
// const bvnRoute = require("./routes/bvnRoute");
const ninRoute = require("./routes/ninRoute");
const account = require("./routes/accountRoutes");
const userRoute = require("./routes/userRoute");
const transferRoute = require("./routes/transferRoute");

const app = express();

// Security Middleware
app.use(helmet());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
// app.use(
//   monogoSanitize({
//     allowDots: true,
//     replaceWith: "_",
//   }),
// );
app.use(hpp());

// Global Rate limiter

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/fintech", nibssRoute);
// app.use("/api/auth", authTokenRoute);
// app.use("/api/", bvnRoute);
app.use("/api/", ninRoute);
// app.use("/api/", account);
app.use("/api/user", userRoute);
app.use("/api/transfer", transferRoute);

// Handling unhandled routes
app.all("*path", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// General Middleware

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Handling error globally
app.use(globalErrorHandler);
module.exports = app;
