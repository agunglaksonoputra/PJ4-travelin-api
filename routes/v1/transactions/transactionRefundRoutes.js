const express = require('express');
const router = express.Router();

const transactionRefundController = require('@controllers/v1/transactions/transactionRefundController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', transactionRefundController.listTransactionRefunds);
router.get('/:id', transactionRefundController.getTransactionRefund);
router.post('/', transactionRefundController.createTransactionRefund);
router.put('/:id', transactionRefundController.updateTransactionRefund);
router.delete('/:id', transactionRefundController.deleteTransactionRefund);

module.exports = router;
