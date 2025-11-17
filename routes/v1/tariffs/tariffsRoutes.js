const express = require('express');
const router = express.Router();

const tariffController = require('@controllers/v1/tariff/tariffController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', tariffController.listTariffs);
router.get('/:id', tariffController.getTariff);
router.post('/', tariffController.createTariff);
router.put('/:id', tariffController.updateTariff);
router.delete('/:id', tariffController.deleteTariff);

module.exports = router;
