const express = require('express');
const router = express.Router();

const ownerWithdrawalController = require('@controllers/v1/owner/ownerWithdrawalController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);

router.get('/', authorizeRole(['admin', 'owner']), ownerWithdrawalController.listOwnerWithdrawals);
router.get('/:id', authorizeRole(['admin', 'owner']), ownerWithdrawalController.getOwnerWithdrawal);
router.post('/', authorizeRole(['admin', 'owner']), ownerWithdrawalController.createOwnerWithdrawal);
router.put('/:id', authorizeRole(['admin', 'owner']), ownerWithdrawalController.updateOwnerWithdrawal);
router.delete('/:id', authorizeRole(['admin']), ownerWithdrawalController.deleteOwnerWithdrawal);

module.exports = router;
