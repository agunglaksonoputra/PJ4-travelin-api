const express = require("express");
const router = express.Router();
const authController = require("@controllers/v1/auth.controller");
const {protectRoute} = require("@middlewares/auth.middleware");
const {authorizeRole} = require("../../middlewares/auth.middleware");

router.get("/token", protectRoute, authorizeRole(['admin']), authController.getAllTokens);
router.post("/token", protectRoute, authorizeRole(['admin']), authController.generateToken);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
