const express = require('express');
const router = express.Router();

const transactionsController = require('@controllers/v1/transactions/transactionsController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', transactionsController.listTransactions);
router.get('/:id', transactionsController.getTransaction);
router.post('/', transactionsController.createTransaction);
router.put('/:id', transactionsController.updateTransaction);
router.delete('/:id', transactionsController.deleteTransaction);

module.exports = router;
