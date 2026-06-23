const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const { isOwner } = require('../middlewares/authorize-middleware');
const {
    getMinimalWarehouses,
    getAssignedProducts,
    getAssignedUsers,
    getUnassignedProducts,
    getUnassignedUsers,
    assignProducts,
    assignUsers,
    toggleProductStatus,
    removeAssignedProduct,
    removeAssignedUser
} = require('../controllers/access-controller');

const router = express.Router();

router.get('/warehouses', authMiddleware, isOwner, getMinimalWarehouses);
router.get('/warehouses/:warehouseId/products', authMiddleware, isOwner, getAssignedProducts);
router.get('/warehouses/:warehouseId/users', authMiddleware, isOwner, getAssignedUsers);
router.get('/warehouses/:warehouseId/products/unassigned', authMiddleware, isOwner, getUnassignedProducts);
router.get('/warehouses/:warehouseId/users/unassigned', authMiddleware, isOwner, getUnassignedUsers);
router.post('/warehouses/:warehouseId/products', authMiddleware, isOwner, assignProducts);
router.post('/warehouses/:warehouseId/users', authMiddleware, isOwner, assignUsers);
router.patch('/warehouses/:warehouseId/products/:productId/status', authMiddleware, isOwner, toggleProductStatus);
router.delete('/warehouses/:warehouseId/products/:productId', authMiddleware, isOwner, removeAssignedProduct);
router.delete('/warehouses/:warehouseId/users/:userId', authMiddleware, isOwner, removeAssignedUser);

module.exports = router;
