const accessModel = require('../models/access-model');

// 1. Get Minimal Warehouses
const getMinimalWarehouses = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const warehouses = await accessModel.getMinimalWarehouses(businessId);
        return res.status(200).json({
            status: true,
            data: warehouses
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

// 2. Get Assigned Products
const getAssignedProducts = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId } = req.params;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const result = await accessModel.getAssignedProducts(warehouseId, businessId, offset, limit, search);
        
        return res.status(200).json({
            status: true,
            data: result.products,
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
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 3. Get Assigned Users
const getAssignedUsers = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId } = req.params;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || "";
        const offset = (page - 1) * limit;

        const result = await accessModel.getAssignedUsers(warehouseId, businessId, offset, limit, search);
        
        return res.status(200).json({
            status: true,
            data: result.users,
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
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

// 4. Get Unassigned Products
const getUnassignedProducts = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId } = req.params;
        const search = req.query.search || "";

        const products = await accessModel.getUnassignedProducts(warehouseId, businessId, search);
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

// 5. Get Unassigned Users
const getUnassignedUsers = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId } = req.params;
        const search = req.query.search || "";

        const users = await accessModel.getUnassignedUsers(warehouseId, businessId, search);
        return res.status(200).json({
            status: true,
            data: users
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

// 6. Assign Products
const assignProducts = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const { itemIds } = req.body;

        if (!itemIds || !Array.isArray(itemIds)) {
            return res.status(400).json({
                status: false,
                message: "Please select products to assign.",
                alertTitle: "Selection Required",
                alertType: "error",
                autoClose: true
            });
        }

        if (await accessModel.assignProducts(warehouseId, itemIds)) {
            return res.status(200).json({
                status: true,
                message: "Products have been successfully assigned to the warehouse.",
                alertTitle: "Products Assigned",
                alertType: "success",
                autoClose: true
            });
        }
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

// 7. Assign Users
const assignUsers = async (req, res) => {
    try {
        const { warehouseId } = req.params;
        const { userIds } = req.body;

        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                status: false,
                message: "Please select users to assign.",
                alertTitle: "Selection Required",
                alertType: "error",
                autoClose: true
            });
        }

        if (await accessModel.assignUsers(warehouseId, userIds)) {
            return res.status(200).json({
                status: true,
                message: "Users have been successfully assigned to the warehouse.",
                alertTitle: "Users Assigned",
                alertType: "success",
                autoClose: true
            });
        }
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

// 8. Remove Product Access
const removeAssignedProduct = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { warehouseId, productId } = req.params;

        const result = await accessModel.removeAssignedProduct(warehouseId, productId, businessId);
        
        if (!result.status) {
            return res.status(400).json({
                status: false,
                message: result.message + " Consider toggling the status button to temporarily block access instead.",
                alertTitle: "Removal Blocked",
                alertType: "error",
                autoClose: true
            });
        }

        return res.status(200).json({
            status: true,
            message: "Product access has been successfully removed.",
            alertTitle: "Product Removed",
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

// 9. Remove User Access
const removeAssignedUser = async (req, res) => {
    try {
        const { warehouseId, userId } = req.params;

        if (await accessModel.removeAssignedUser(warehouseId, userId)) {
            return res.status(200).json({
                status: true,
                message: "User access has been successfully removed.",
                alertTitle: "User Removed",
                alertType: "success",
                autoClose: true
            });
        }
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

// 10. Toggle Product Status
const toggleProductStatus = async (req, res) => {
    try {
        const { warehouseId, productId } = req.params;
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

        if (await accessModel.toggleProductStatus(warehouseId, productId, is_active)) {
            return res.status(200).json({
                status: true,
                message: `Product has been successfully ${is_active ? 'activated' : 'deactivated'} for this warehouse.`,
                alertTitle: "Status Updated",
                alertType: "success",
                autoClose: true
            });
        }
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

module.exports = {
    getMinimalWarehouses,
    getAssignedProducts,
    getAssignedUsers,
    getUnassignedProducts,
    getUnassignedUsers,
    assignProducts,
    assignUsers,
    removeAssignedProduct,
    removeAssignedUser,
    toggleProductStatus
};
