const express = require("express");
const authController = require("../controllers/authControler");
const { authLimiter, limiter } = require("../middleware/limiter");

const router = express.Router();

router.post("/signup", authLimiter, authController.signup);
router.post("/login", limiter, authController.login);

router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);

router.use(authController.protect); // Protect all routes after this middleware

router.get("/me", authController.getMe);
router.patch("/updateMe", authController.updateMe);

// router.patch(
//   "/updatePassword/:token",
//   authController.protect,
//   authController.updatePassword,
// );

module.exports = router;
