const express = require('express');
const router = express.Router();
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');
const transactionPaymentController = require('@controllers/v1/transactions/transactionPaymentController');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', transactionPaymentController.listTransactionPayments);
router.get('/:id', transactionPaymentController.getTransactionPayment);
router.post('/', transactionPaymentController.createTransactionPayment);
router.put('/:id', transactionPaymentController.updateTransactionPayment);
router.delete('/:id', transactionPaymentController.deleteTransactionPayment);

module.exports = router;
