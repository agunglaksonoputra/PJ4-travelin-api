const express = require("express");
const router = express.Router();

const authRoute = require("@routes/v1/auth.routes");
const vehicleRoute = require('@routes/v1/vehicles/vehicleRoutes');
const activityLogRoute = require('@routes/v1/activityLogs/activityLogsRoutes');
const tariffRoute = require('@routes/v1/tariffs/tariffsRoutes');
const transactionRoute = require('@routes/v1/transactions/transactionsRoutes');
const transactionStatusLogRoute = require('@routes/v1/transactions/transactionsStatusLogRoutes');

// Daftarkan dengan prefix masing-masing
router.use("/auth", authRoute);
router.use('/vehicles', vehicleRoute);
router.use('/activity-logs', activityLogRoute);
router.use('/tariffs', tariffRoute);
router.use('/transactions/status-logs', transactionStatusLogRoute);
router.use('/transactions', transactionRoute);

module.exports = router;

