const express = require('express');
const router = express.Router();

const transactionsStatusLogController = require('@controllers/v1/transactions/transactionsStatusLogController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', transactionsStatusLogController.listTransactionStatusLogs);
router.get('/:id', transactionsStatusLogController.getTransactionStatusLog);
router.post('/', transactionsStatusLogController.createTransactionStatusLog);

module.exports = router;
