const express = require("express");
const router = express.Router();

const transactionsController = require("@controllers/v1/transactions/transactionsController");
const { protectRoute, authorizeRole } = require("@middlewares/auth.middleware");

router.use(protectRoute);
router.use(authorizeRole(["admin", "staff", "owner"]));

router.get("/summary", transactionsController.getTransactionSummary);
router.get("/paid-amount/closed/total", transactionsController.getTotalPaidAmountClosed);
router.get("/by-status/all", transactionsController.getOneTransactionPerStatus);
router.get("/by-status", transactionsController.getTransactionsByStatus);
router.get("/by-status/:status", transactionsController.getTransactionsByStatus);
router.get("/reporting", transactionsController.getReportingTransactions);
router.get("/", transactionsController.listTransactions);
router.get("/:id", transactionsController.getTransaction);
router.post("/", transactionsController.createTransaction);
router.post("/:id/payment-plan", transactionsController.setPaymentPlan);
router.put("/:id", transactionsController.updateTransaction);
router.delete("/:id", transactionsController.deleteTransaction);

module.exports = router;
