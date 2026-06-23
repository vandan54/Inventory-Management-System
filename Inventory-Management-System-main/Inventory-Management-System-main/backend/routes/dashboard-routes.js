const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const { isOwner, isManager } = require('../middlewares/authorize-middleware');

router.get('/owner', authMiddleware, isOwner, dashboardController.getOwnerDashboard);
router.get('/manager', authMiddleware, isManager, dashboardController.getManagerDashboard);

module.exports = router;
