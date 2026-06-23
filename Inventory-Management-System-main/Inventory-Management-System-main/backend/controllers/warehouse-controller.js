const { addWarehouse, editWarehouse, removeWarehouse, getWarehouse, getWarehouseByID } = require('../models/warehouse-model');
const { getUser } = require('../models/auth-model');
const { verifyPassword } = require('../helpers/password-helper');

const createWarehouse = async (req, res) => {
    try {
        const { name, address, city, state, postal_code, country } = req.body ?? {};

        const requiredField = ['name', 'address', 'city', 'state', 'postal_code', 'country'];
        const missingFields = requiredField.filter(fields =>
            req.body[fields] == null ||
            req.body[fields] === ""
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please provide: ${missingFields.join(', ')}`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        // Validate Postal Code (Must be exactly 6 digits)
        const postalCodeRegex = /^[0-9]{6}$/;
        if (!postalCodeRegex.test(postal_code)) {
            return res.status(400).json({
                status: false,
                message: "Please provide a valid 6-digit postal code.",
                alertTitle: "Invalid Postal Code",
                alertType: "error",
                autoClose: true
            });
        }

        if (await addWarehouse(req.user.userbusinessId, name, address, city, state, postal_code, country)) {
            return res.status(201).json({
                status: true,
                message: "Warehouse has been added successfully. You can now manage inventory from this location.",
                alertTitle: "Warehouse Created",
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
}

const updateWarehouse = async (req, res) => {
    try {
        const { name, address, city, state, postal_code, country, is_locked } = req.body ?? {};

        const requiredField = ['name', 'address', 'city', 'state', 'postal_code', 'country', 'is_locked'];
        const missingFields = requiredField.filter(fields =>
            req.body[fields] == null ||
            req.body[fields] === ""
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please provide: ${missingFields.join(', ')}`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        // Validate Postal Code (Must be exactly 6 digits)
        const postalCodeRegex = /^[0-9]{6}$/;
        if (!postalCodeRegex.test(postal_code)) {
            return res.status(400).json({
                status: false,
                message: "Please provide a valid 6-digit postal code.",
                alertTitle: "Invalid Postal Code",
                alertType: "error",
                autoClose: true
            });
        }

        if (!await getWarehouseByID(req.params.id, req.user.userbusinessId)) {
            return res.status(404).json({
                status: false,
                message: "Warehouse not found. Please check the ID and try again.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await editWarehouse(req.params.id, req.user.userbusinessId, name, address, city, state, postal_code, country, is_locked)) {
            return res.status(200).json({
                status: true,
                message: "Warehouse has been updated successfully.",
                alertTitle: "Warehouse Updated",
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
}

const deleteWarehouse = async (req, res) => {
    try {
        const { password } = req.body ?? {};

        if (!password) {
            return res.status(400).json({
                status: false,
                message: `Please provide password to continue.`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const [result] = await getUser(req.user.userEmail);
        const user = result[0];

        if (!await verifyPassword(password, user.password_hash)) {
            return res.status(401).json({
                status: false,
                message: "Incorrect password. Please try again.",
                alertTitle: "Authentication Failed",
                alertType: "error",
                autoClose: true
            });
        }

        if (!await getWarehouseByID(req.params.id, req.user.userbusinessId)) {
            return res.status(404).json({
                status: false,
                message: "Warehouse not found. Please check the ID and try again.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await removeWarehouse(req.params.id, req.user.userbusinessId)) {
            return res.status(200).json({
                status: true,
                message: "Warehouse has been deleted successfully. All inventory associated with this warehouse will be archived and cannot be accessed.",
                alertTitle: "Warehouse Deleted",
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
}

const listWarehouses = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        const result = await getWarehouse(req.user.userbusinessId, offset, limit, search);

        return res.json({
            status: true,
            data: result.warehouses,
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
}

module.exports = {
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
    listWarehouses
};