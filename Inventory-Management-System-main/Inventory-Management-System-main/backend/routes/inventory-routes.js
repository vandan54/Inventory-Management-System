const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const { isStaff } = require('../middlewares/authorize-middleware');
const {
    getStaffWarehouse,
    getWarehouseProducts,
    getReasons,
    getProductBatches,
    getProductSerials,
    stockIn,
    stockOut,
    getStaffRecentLogs
} = require('../controllers/inventory-controller');

const router = express.Router();

router.get('/staff-warehouse', authMiddleware, isStaff, getStaffWarehouse);
router.get('/warehouse/:warehouseId/products', authMiddleware, isStaff, getWarehouseProducts);
router.get('/reasons/:type', authMiddleware, isStaff, getReasons);
router.get('/warehouse/:warehouseId/product/:productId/batches', authMiddleware, isStaff, getProductBatches);
router.get('/warehouse/:warehouseId/product/:productId/serials', authMiddleware, isStaff, getProductSerials);
router.post('/warehouse/:warehouseId/stock-in', authMiddleware, isStaff, stockIn);
router.post('/warehouse/:warehouseId/stock-out', authMiddleware, isStaff, stockOut);
router.get('/recent-logs', authMiddleware, isStaff, getStaffRecentLogs);

module.exports = router;
