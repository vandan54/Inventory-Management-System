const managerModel = require('../models/manager-model');

// 1. Get Manager's Assigned Warehouses
const getManagerWarehouses = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const managerId = req.user.userId;

        const warehouses = await managerModel.getManagerWarehouses(businessId, managerId);
        
        return res.status(200).json({
            status: true,
            data: warehouses,
            message: "Warehouses fetched successfully"
        });
    } catch (err) {
        console.error('Error fetching manager warehouses:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 2. Get Staff Users for a Manager's Warehouse
const getWarehouseStaff = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const managerId = req.user.userId;
        const { warehouseId } = req.params;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';

        // Check if Manager has access to this warehouse
        const warehouses = await managerModel.getManagerWarehouses(businessId, managerId);
        const hasAccess = warehouses.some(w => w.id === parseInt(warehouseId));
        
        if (!hasAccess) {
            return res.status(403).json({
                status: false,
                message: "You do not have permission to view staff for this warehouse.",
                alertTitle: "Access Denied",
                alertType: "warning",
                autoClose: true
            });
        }

        const offset = (page - 1) * limit;
        const result = await managerModel.getWarehouseStaff(businessId, warehouseId, search, offset, limit);
        
        return res.status(200).json({
            status: true,
            data: result.staff,
            pagination: {
                total: result.total,
                currentPage: page,
                limit: limit,
                totalPages: Math.ceil(result.total / limit) || 1
            }
        });
    } catch (err) {
        console.error('Error fetching warehouse staff:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 3. Toggle Staff Status
const toggleStaffStatus = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const managerId = req.user.userId;
        const { warehouseId, staffId } = req.params;
        const { is_active } = req.body;

        if (is_active === undefined) {
             return res.status(400).json({
                status: false,
                message: "Missing active status information.",
                alertTitle: "Invalid Request",
                alertType: "error",
                autoClose: true
            });
        }

        // Check if Manager has access to this warehouse
        const warehouses = await managerModel.getManagerWarehouses(businessId, managerId);
        const hasAccess = warehouses.some(w => w.id === parseInt(warehouseId));

        if (!hasAccess) {
            return res.status(403).json({
                status: false,
                message: "You do not have permission to modify staff for this warehouse.",
                alertTitle: "Access Denied",
                alertType: "warning",
                autoClose: true
            });
        }

        const success = await managerModel.toggleStaffStatus(staffId, businessId, is_active);

        if (!success) {
            return res.status(404).json({
                status: false,
                message: "Staff member not found or cannot be modified.",
                alertTitle: "Not Found",
                alertType: "warning",
                autoClose: true
            });
        }

        return res.status(200).json({
            status: true,
            message: `Staff has been successfully ${is_active ? 'activated' : 'deactivated'}.`,
            alertTitle: "Status Updated",
            alertType: "success",
            autoClose: true
        });
    } catch (err) {
        console.error('Error toggling staff status:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

module.exports = {
    getManagerWarehouses,
    getWarehouseStaff,
    toggleStaffStatus
};
