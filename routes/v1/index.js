const express = require("express");
const router = express.Router();

const authRoute = require("@routes/v1/auth.routes");
const vehicleRoute = require('@routes/v1/vehicles/vehicleRoutes');
const activityLogRoute = require('@routes/v1/activityLogs/activityLogsRoutes');
const tariffRoute = require('@routes/v1/tariffs/tariffsRoutes');
const transactionRoute = require('@routes/v1/transactions/transactionsRoutes');
const transactionStatusLogRoute = require('@routes/v1/transactions/transactionsStatusLogRoutes');
const transactionPaymentRoute = require('@routes/v1/transactions/transactionPaymentRoutes');
const transactionRefundRoute = require('@routes/v1/transactions/transactionRefundRoutes');
const transactionReportRoute = require('@routes/v1/transactions/transactionReportRoutes');
const ownerRoute = require('@routes/v1/owners/ownerRoutes');
const ownerWithdrawalRoute = require('@routes/v1/owners/ownerWithdrawalRoutes');
const profitShareRoute = require('@routes/v1/profitShare/profitShareRoutes');

// Daftarkan dengan prefix masing-masing
router.use("/auth", authRoute);
router.use('/vehicles', vehicleRoute);
router.use('/activity-logs', activityLogRoute);
router.use('/tariffs', tariffRoute);
router.use('/owners/withdrawals', ownerWithdrawalRoute);
router.use('/owners', ownerRoute);
router.use('/profit-shares', profitShareRoute);
router.use('/transactions/status-logs', transactionStatusLogRoute);
router.use('/transactions/payments', transactionPaymentRoute);
router.use('/transactions/refunds', transactionRefundRoute);
router.use('/transactions/reports', transactionReportRoute);
router.use('/transactions', transactionRoute);

module.exports = router;

