const express = require('express');
const router = express.Router();

const ownerController = require('@controllers/v1/owner/ownerController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', ownerController.listOwners);
router.get('/:id', ownerController.getOwner);
router.post('/', ownerController.createOwner);
router.put('/:id', ownerController.updateOwner);
router.delete('/:id', ownerController.deleteOwner);

module.exports = router;
