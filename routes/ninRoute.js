const express = require("express");
const { insertNin, validateNin } = require("../controllers/ninController");

const router = express.Router();

router.post("/insertNin", insertNin);
router.post("/validateNin", validateNin);

module.exports = router;
