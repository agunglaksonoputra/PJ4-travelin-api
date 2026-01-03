const express = require("express");
const router = express.Router();

const ownerWithdrawalController = require("@controllers/v1/owner/ownerWithdrawalController");
const { protectRoute, authorizeRole } = require("@middlewares/auth.middleware");

router.use(protectRoute);
router.use(authorizeRole(["admin", "owner"]));

router.get("/", ownerWithdrawalController.listOwnerWithdrawals);
router.post("/", ownerWithdrawalController.createOwnerWithdrawal);
router.get("/:id", ownerWithdrawalController.getOwnerWithdrawal);
router.put("/:id/refund", ownerWithdrawalController.refundOwnerWithdrawal);
router.delete("/:id", ownerWithdrawalController.deleteOwnerWithdrawal);

module.exports = router;
