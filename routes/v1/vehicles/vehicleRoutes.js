const express = require('express');
const router = express.Router();

const vehicleController = require('@controllers/v1/vehicles/vehiclesController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', vehicleController.listVehicles);
router.get('/:id', vehicleController.getVehicle);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

module.exports = router;
