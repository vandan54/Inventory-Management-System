const inventoryViewModel = require('../models/inventory-view-model');

// Internal Helper to get allowed warehouse scopes for any user role
const getAllowedWarehouses = async (req) => {
    const businessId = req.user.userbusinessId;
    const userId = req.user.userId;
    const role = req.user.userRole;

    let warehouses = [];
    if (role === 'owner') {
        warehouses = await inventoryViewModel.getAdminWarehouses(businessId);
    } else if (role === 'manager') {
        warehouses = await inventoryViewModel.getManagerWarehouses(businessId, userId);
    } else if (role === 'staff') {
        warehouses = await inventoryViewModel.getStaffWarehouse(businessId, userId);
    }
    return warehouses;
};

// 1. Get Warehouses
const getWarehouses = async (req, res) => {
    try {
        const warehouses = await getAllowedWarehouses(req);
        return res.status(200).json({
            status: true,
            data: warehouses
        });
    } catch (err) {
        console.error('Error fetching warehouses:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while fetching warehouses.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 2. Get Inventory List
const getInventoryList = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseIds, filters: bodyFilters = {} } = req.body;
        
        // Merge query search into filters
        const filters = { ...bodyFilters, search: req.query.search || bodyFilters.search || '' };

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Security check: Only allow query on warehouses the user actually has access to
        const allowedWarehouses = await getAllowedWarehouses(req);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = [];
        if (!warehouseIds || warehouseIds.length === 0) {
            // Default to all allowed
            targetWarehouseIds = allowedIds;
        } else {
            // Intersect requested with allowed to prevent API spoofing
            targetWarehouseIds = warehouseIds.filter(id => allowedIds.includes(Number(id)));
        }

        if (targetWarehouseIds.length === 0) {
             return res.status(200).json({
                status: true,
                data: [],
                pagination: { totalPages: 0, currentPage: page, total: 0 }
            });
        }

        const result = await inventoryViewModel.getInventoryList(businessId, targetWarehouseIds, filters || {}, offset, limit);
        
        return res.status(200).json({
            status: true,
            data: result.inventory,
            pagination: {
                currentPage: page,
                limit: limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (err) {
        console.error('Error fetching inventory list:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while fetching the inventory list.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 3. Get Inventory KPIs
const getInventoryKPIs = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseIds, filters: bodyFilters = {} } = req.body; 

        // Merge query search into filters
        const filters = { ...bodyFilters, search: req.query.search || bodyFilters.search || '' };

        // Security check
        const allowedWarehouses = await getAllowedWarehouses(req);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = [];
        if (!warehouseIds || warehouseIds.length === 0) {
           targetWarehouseIds = allowedIds;
        } else {
           targetWarehouseIds = warehouseIds.filter(id => allowedIds.includes(Number(id)));
        }

        if (targetWarehouseIds.length === 0) {
             return res.status(200).json({
                status: true,
                data: { totalProducts: 0, lowStockAlerts: 0, expiringSoon: 0 }
            });
        }

        const kpis = await inventoryViewModel.getInventoryKPIs(businessId, targetWarehouseIds, filters);
        
        return res.status(200).json({
            status: true,
            data: kpis
        });
    } catch (err) {
        console.error('Error fetching KPIs:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while fetching KPIs.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 4. Get Item Details (Only load breakdown and batches when requested)
const getItemDetails = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { itemId } = req.params;
        const { warehouseIds } = req.body; 

        // Security check
        const allowedWarehouses = await getAllowedWarehouses(req);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = [];
        if (!warehouseIds || warehouseIds.length === 0) {
           targetWarehouseIds = allowedIds;
        } else {
           targetWarehouseIds = warehouseIds.filter(id => allowedIds.includes(Number(id)));
        }

        if (targetWarehouseIds.length === 0) {
             return res.status(200).json({
                status: true,
                data: { breakdown: [], details: [] }
            });
        }

        const details = await inventoryViewModel.getItemDetails(businessId, itemId, targetWarehouseIds);
        
        return res.status(200).json({
            status: true,
            data: details
        });
    } catch (err) {
        console.error('Error fetching item details:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while fetching item details.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

module.exports = {
    getWarehouses,
    getInventoryList,
    getInventoryKPIs,
    getItemDetails
};
