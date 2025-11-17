const express = require('express');
const router = express.Router();

const activityLogsController = require('@controllers/v1/activityLogs/activityLogsController');
const { protectRoute, authorizeRole } = require('@middlewares/auth.middleware');

router.use(protectRoute);
router.use(authorizeRole(['admin']));

router.get('/', activityLogsController.listActivityLogs);
router.get('/:id', activityLogsController.getActivityLog);

module.exports = router;
