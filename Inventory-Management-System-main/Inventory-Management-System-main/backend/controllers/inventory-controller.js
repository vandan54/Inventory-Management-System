const inventoryModel = require('../models/inventory-model');

// 1. Get staff's assigned warehouse
const getStaffWarehouse = async (req, res) => {
    try {
        const userId = req.user.userId;
        const warehouse = await inventoryModel.getStaffWarehouse(userId);

        if (!warehouse) {
            return res.status(200).json({
                status: true,
                hasAccess: false,
                data: null
            });
        }

        return res.status(200).json({
            status: true,
            hasAccess: true,
            data: warehouse
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 2. Get products assigned to staff's warehouse
const getWarehouseProducts = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId } = req.params;

        const products = await inventoryModel.getWarehouseProducts(warehouseId, businessId);
        return res.status(200).json({
            status: true,
            data: products
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 3. Get transaction reasons
const getReasons = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { type } = req.params;

        if (type !== 'IN' && type !== 'OUT') {
            return res.status(400).json({
                status: false,
                message: "Invalid transaction type.",
                alertTitle: "Bad Request",
                alertType: "error",
                autoClose: true
            });
        }

        const reasons = await inventoryModel.getReasonsByType(type, businessId);
        return res.status(200).json({
            status: true,
            data: reasons
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 4. Get existing batches for a product (for OUT flow)
const getProductBatches = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId, productId } = req.params;

        const batches = await inventoryModel.getProductBatches(productId, warehouseId, businessId);
        return res.status(200).json({
            status: true,
            data: batches
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 5. Get existing serials for a product (for OUT flow)
const getProductSerials = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId, productId } = req.params;

        const serials = await inventoryModel.getProductSerials(productId, warehouseId, businessId);
        return res.status(200).json({
            status: true,
            data: serials
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 6. Execute Stock IN
const stockIn = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const performedBy = req.user.userId;
        const { warehouseId } = req.params;
        const { productId, quantity, reasonId, batchNumber, expiryDate, serialNumber, trackingMode } = req.body;

        if (!productId || !reasonId) {
            return res.status(400).json({
                status: false,
                message: "Please select a product and reason.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        let result;

        if (trackingMode === 'serial') {
            if (!serialNumber || !serialNumber.trim()) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a serial number.",
                    alertTitle: "Missing Serial",
                    alertType: "error",
                    autoClose: true
                });
            }
            result = await inventoryModel.stockInSerial(businessId, productId, warehouseId, reasonId, serialNumber.trim(), performedBy);
        } else if (trackingMode === 'batch' || trackingMode === 'batch+expiry') {
            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a valid quantity.",
                    alertTitle: "Invalid Quantity",
                    alertType: "error",
                    autoClose: true
                });
            }
            if (!batchNumber || !batchNumber.trim()) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a batch number.",
                    alertTitle: "Missing Batch",
                    alertType: "error",
                    autoClose: true
                });
            }
            result = await inventoryModel.stockInBatch(businessId, productId, warehouseId, quantity, reasonId, batchNumber.trim(), expiryDate || null, performedBy);
        } else {
            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a valid quantity.",
                    alertTitle: "Invalid Quantity",
                    alertType: "error",
                    autoClose: true
                });
            }
            result = await inventoryModel.stockInQuantity(businessId, productId, warehouseId, quantity, reasonId, performedBy);
        }

        if (result) {
            return res.status(200).json({
                status: true,
                message: "Stock has been successfully received and recorded.",
                alertTitle: "Stock IN Confirmed",
                alertType: "success",
                autoClose: true
            });
        }
    } catch (err) {
        console.error('Error:', err);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                status: false,
                message: "This serial number or batch already exists in the system.",
                alertTitle: "Duplicate Entry",
                alertType: "error",
                autoClose: true
            });
        }

        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 7. Execute Stock OUT
const stockOut = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const performedBy = req.user.userId;
        const { warehouseId } = req.params;
        const { productId, quantity, reasonId, batchSelections, serialIds, trackingMode } = req.body;

        if (!productId || !reasonId) {
            return res.status(400).json({
                status: false,
                message: "Please select a product and reason.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        let result;

        if (trackingMode === 'serial') {
            if (!serialIds || serialIds.length === 0) {
                return res.status(400).json({
                    status: false,
                    message: "Please select at least one serial number to remove.",
                    alertTitle: "No Selection",
                    alertType: "error",
                    autoClose: true
                });
            }
            result = await inventoryModel.stockOutSerial(businessId, productId, warehouseId, reasonId, serialIds, performedBy);
        } else if (trackingMode === 'batch' || trackingMode === 'batch+expiry') {
            if (!batchSelections || batchSelections.length === 0 || batchSelections.every(b => b.quantity <= 0)) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter quantity to remove from at least one batch.",
                    alertTitle: "No Selection",
                    alertType: "error",
                    autoClose: true
                });
            }
            result = await inventoryModel.stockOutBatch(businessId, productId, warehouseId, reasonId, batchSelections, performedBy);
        } else {
            if (!quantity || quantity <= 0) {
                return res.status(400).json({
                    status: false,
                    message: "Please enter a valid quantity.",
                    alertTitle: "Invalid Quantity",
                    alertType: "error",
                    autoClose: true
                });
            }
            result = await inventoryModel.stockOutQuantity(businessId, productId, warehouseId, quantity, reasonId, performedBy);
        }

        if (!result.success) {
            return res.status(400).json({
                status: false,
                message: result.message,
                alertTitle: "Stock OUT Failed",
                alertType: "error",
                autoClose: true
            });
        }

        return res.status(200).json({
            status: true,
            message: "Stock has been successfully dispatched and recorded.",
            alertTitle: "Stock OUT Confirmed",
            alertType: "success",
            autoClose: true
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 8. Get staff's recent movement history (Paginated)
const getStaffRecentLogs = async (req, res) => {
    try {
        const userId = req.user.userId;
        const businessId = req.user.userbusinessId;
        
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 15;
        const offset = (page - 1) * limit;

        const result = await inventoryModel.getStaffRecentLogs(userId, businessId, offset, limit);
        
        return res.status(200).json({
            status: true,
            data: result.logs,
            pagination: {
                currentPage: page,
                limit: limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while fetching logs.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

module.exports = {
    getStaffWarehouse,
    getWarehouseProducts,
    getReasons,
    getProductBatches,
    getProductSerials,
    stockIn,
    stockOut,
    getStaffRecentLogs
};
