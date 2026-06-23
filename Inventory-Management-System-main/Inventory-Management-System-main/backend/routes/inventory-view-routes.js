const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const {
    getWarehouses,
    getInventoryList,
    getInventoryKPIs,
    getItemDetails
} = require('../controllers/inventory-view-controller');

const router = express.Router();

// Fetch allowed warehouses based on user role
router.get('/warehouses', authMiddleware, getWarehouses);

// Fetch paginated inventory list with filters (using POST to easily send arrays)
router.post('/list', authMiddleware, getInventoryList);

// Fetch KPI metrics for dashboard
router.post('/kpis', authMiddleware, getInventoryKPIs);

// Fetch item details (breakdown, batches, serials)
router.post('/item/:itemId/details', authMiddleware, getItemDetails);

module.exports = router;
