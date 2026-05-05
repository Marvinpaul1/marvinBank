const express = require("express");
const router = express.Router();
const { protect } = require("../controllers/authControler");
const {
  internalTransfer,
  externalTransfer,
  nameEnquiry,
  getTransactionStatus,
  getTransferHistory,
  getTransfer,
} = require("../controllers/transferController");

router.use(protect); // all routes require auth

router.post("/internal", internalTransfer);
router.post("/external", externalTransfer);
router.get("/name-enquiry/:accountNumber", nameEnquiry);
router.get("/status/:transactionId", getTransactionStatus);
router.get("/history", getTransferHistory);
router.get("/:reference", getTransfer);

module.exports = router;
