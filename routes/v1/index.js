const express = require("express");
const router = express.Router();

const authRoute = require("@routes/v1/auth.routes");

// Daftarkan dengan prefix masing-masing
router.use("/auth", authRoute);

module.exports = router;

