const express = require('express');
const router = express.Router();

const profitShareController = require('@controllers/v1/profitShare/profitShareController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', profitShareController.listProfitShares);
router.get('/:id', profitShareController.getProfitShare);
router.post('/', profitShareController.createProfitShare);
router.put('/:id', profitShareController.updateProfitShare);
router.delete('/:id', profitShareController.deleteProfitShare);

module.exports = router;

