const express = require("express");
const router = express.Router();
const authController = require("@controllers/v1/auth.controller");

router.get("/token", authController.getAllTokens);
router.post("/token", authController.generateToken);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
