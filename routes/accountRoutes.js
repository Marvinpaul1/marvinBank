const express = require("express");
const {
  nameEnquiry,
  accounts,
  getBalance,
} = require("../controllers/accountController");

const router = express.Router();
router.get("/account/name-enquiry/:accountNumber", nameEnquiry);
router.get("/accounts", accounts);
router.get("/account/balance/:accountNumber", getBalance);

module.exports = router;
