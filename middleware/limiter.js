const rateLimit = require("express-rate-limit");

exports.limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: {
    success: false,
    message: "Too many request. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter for Auth
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many auth attemps. Please try again in 5 minutes.",
  },
});
