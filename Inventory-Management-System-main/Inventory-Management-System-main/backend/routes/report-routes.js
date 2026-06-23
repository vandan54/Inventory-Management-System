const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report-controller');
const authMiddleware = require('../middlewares/auth-middleware');
const { isOwner, isManager } = require('../middlewares/authorize-middleware');

// Strict role-based reporting endpoints
router.post('/owner', authMiddleware, isOwner, reportController.getOwnerReport);
router.post('/manager', authMiddleware, isManager, reportController.getManagerReport);

// Metadata for filters
router.post('/owner/metadata', authMiddleware, isOwner, reportController.getOwnerMetadata);
router.post('/manager/metadata', authMiddleware, isManager, reportController.getManagerMetadata);

module.exports = router;
