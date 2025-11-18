const express = require('express');
const router = express.Router();

const transactionReportController = require('@controllers/v1/transactions/transactionReportController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', transactionReportController.listTransactionReports);
router.get('/:id', transactionReportController.getTransactionReport);
router.post('/', transactionReportController.createTransactionReport);
router.put('/:id', transactionReportController.updateTransactionReport);
router.delete('/:id', transactionReportController.deleteTransactionReport);

module.exports = router;