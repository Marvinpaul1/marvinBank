const express = require("express");
const fintechOnboard = require("../controllers/fintechOnboard");

const router = express.Router();

router.post("/onboard", fintechOnboard);

module.exports = router;
