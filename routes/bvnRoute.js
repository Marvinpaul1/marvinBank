const express = require("express");
const { validateBvn } = require("../controllers/bvnController");

const router = express.Router();

router.post("/validateBvn", validateBvn);

module.exports = router;
