const { addProduct, editProduct, removeProduct, getProduct, getProductByID } = require('../models/product-model');
const { getUser } = require('../models/auth-model');
const { verifyPassword } = require('../helpers/password-helper');

const createProduct = async (req, res) => {
    try {
        const { name, sku, unit, category, description, reorder_level, track_batch, track_expiry, track_serial } = req.body ?? {};

        const requiredField = ['name', 'sku', 'unit', 'category', 'description', 'reorder_level', 'track_batch', 'track_expiry', 'track_serial'];
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

        if (await addProduct(req.user.userbusinessId, name, sku, unit, category, description, reorder_level, track_batch, track_expiry, track_serial)) {
            return res.status(201).json({
                status: true,
                message: "Product has been added successfully. You can now manage inventory for this Product.",
                alertTitle: "Product Created",
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

const updateProduct = async (req, res) => {
    try {
        const { name, sku, unit, category, description, reorder_level, is_locked } = req.body ?? {};

        const requiredField = ['name', 'sku', 'unit', 'category', 'description', 'reorder_level', 'is_locked'];
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

        if (!await getProductByID(req.params.id, req.user.userbusinessId)) {
            return res.status(404).json({
                status: false,
                message: "Product not found. Please check the ID and try again.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await editProduct(req.params.id, req.user.userbusinessId, name, sku, unit, category, description, reorder_level, is_locked)) {
            return res.status(200).json({
                status: true,
                message: "Product has been updated successfully.",
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

const deleteProduct = async (req, res) => {
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

        if (!await getProductByID(req.params.id, req.user.userbusinessId)) {
            return res.status(404).json({
                status: false,
                message: "Product not found. Please check the ID and try again.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await removeProduct(req.params.id, req.user.userbusinessId)) {
            return res.status(200).json({
                status: true,
                message: "Product has been deleted successfully. All inventory associated with this Product will be archived and cannot be accessed.",
                alertTitle: "Product Deleted",
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

const listProducts = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        const result = await getProduct(req.user.userbusinessId, offset, limit, search);

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
    createProduct,
    updateProduct,
    deleteProduct,
    listProducts
};