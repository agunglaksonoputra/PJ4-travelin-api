const express = require("express");
const router = express.Router();

const ownerBalanceController = require("@controllers/v1/owner/ownerBalanceController");
const { protectRoute, authorizeRole } = require("@middlewares/auth.middleware");

router.use(protectRoute);
router.use(authorizeRole(["admin", "owner"]));

router.get("/all", ownerBalanceController.getAllOwnerBalances);
router.get("/:ownerId", ownerBalanceController.getOwnerBalance);

module.exports = router;
