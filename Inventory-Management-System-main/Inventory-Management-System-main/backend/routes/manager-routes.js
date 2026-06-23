const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const { isManager } = require('../middlewares/authorize-middleware');
const {
    getManagerWarehouses,
    getWarehouseStaff,
    toggleStaffStatus
} = require('../controllers/manager-controller');

const router = express.Router();

router.get('/warehouses', authMiddleware, isManager, getManagerWarehouses);
router.get('/warehouses/:warehouseId/staff', authMiddleware, isManager, getWarehouseStaff);
router.patch('/warehouses/:warehouseId/staff/:staffId/status', authMiddleware, isManager, toggleStaffStatus);

module.exports = router;
