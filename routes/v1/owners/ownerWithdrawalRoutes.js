const express = require('express');
const router = express.Router();

const ownerWithdrawalController = require('@controllers/v1/owner/ownerWithdrawalController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['owner']));

router.get('/', ownerWithdrawalController.listOwnerWithdrawals);
router.get('/:id', ownerWithdrawalController.getOwnerWithdrawal);
router.post('/', ownerWithdrawalController.createOwnerWithdrawal);
router.put('/:id', ownerWithdrawalController.updateOwnerWithdrawal);
router.delete('/:id', ownerWithdrawalController.deleteOwnerWithdrawal);

module.exports = router;
