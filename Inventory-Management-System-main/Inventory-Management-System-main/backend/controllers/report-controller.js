const reportModel = require('../models/report-model');
const inventoryViewModel = require('../models/inventory-view-model');

const getOwnerReport = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { reportType, warehouseIds, filters = {} } = req.body;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Owners have access to all warehouses within their business
        const allowedWarehouses = await inventoryViewModel.getAdminWarehouses(businessId);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = (!warehouseIds || warehouseIds.length === 0)
            ? allowedIds
            : warehouseIds.filter(id => allowedIds.includes(Number(id)));

        if (targetWarehouseIds.length === 0) {
            return res.status(200).json({
                status: true,
                data: { overview: {}, results: [] },
                pagination: {
                    totalPages: 0,
                    currentPage: page,
                    total: 0
                }
            });
        }

        const result = await reportModel.getReportData(businessId, targetWarehouseIds, reportType, filters, offset, limit);

        return res.status(200).json({
            status: true,
            data: { overview: result.overview, results: result.results },
            pagination: {
                currentPage: page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (err) {
        console.error('Error generating owner report:', err);
        return res.status(500).json({
            status: false,
            message: "Error generating report.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

const getManagerReport = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const userId = req.user.userId;
        const { reportType, warehouseIds, filters = {} } = req.body;

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // Managers only have access to strictly assigned warehouses
        const allowedWarehouses = await inventoryViewModel.getManagerWarehouses(businessId, userId);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = (!warehouseIds || warehouseIds.length === 0)
            ? allowedIds
            : warehouseIds.filter(id => allowedIds.includes(Number(id)));

        if (targetWarehouseIds.length === 0) {
            return res.status(200).json({
                status: true,
                data: { overview: {}, results: [] },
                pagination: {
                    totalPages: 0,
                    currentPage: page,
                    total: 0
                }
            });
        }

        const result = await reportModel.getReportData(businessId, targetWarehouseIds, reportType, filters, offset, limit);

        return res.status(200).json({
            status: true,
            data: { overview: result.overview, results: result.results },
            pagination: {
                currentPage: page,
                limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (err) {
        console.error('Error generating manager report:', err);
        return res.status(500).json({
            status: false,
            message: "Error generating report.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

const getOwnerMetadata = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const { reportType, warehouseIds } = req.body;

        const allowedWarehouses = await inventoryViewModel.getAdminWarehouses(businessId);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = (!warehouseIds || warehouseIds.length === 0) 
            ? allowedIds 
            : warehouseIds.filter(id => allowedIds.includes(Number(id)));

        const products = await reportModel.getReportProducts(businessId, targetWarehouseIds, reportType);

        return res.status(200).json({
            status: true,
            data: { products }
        });
    } catch (err) {
        console.error('Error fetching owner metadata:', err);
        return res.status(500).json({ 
            status: false, 
            message: "Error fetching metadata.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

const getManagerMetadata = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const userId = req.user.userId;
        const { reportType, warehouseIds } = req.body;

        const allowedWarehouses = await inventoryViewModel.getManagerWarehouses(businessId, userId);
        const allowedIds = allowedWarehouses.map(w => w.value);

        let targetWarehouseIds = (!warehouseIds || warehouseIds.length === 0) 
            ? allowedIds 
            : warehouseIds.filter(id => allowedIds.includes(Number(id)));

        const products = await reportModel.getReportProducts(businessId, targetWarehouseIds, reportType);

        return res.status(200).json({
            status: true,
            data: { products }
        });
    } catch (err) {
        console.error('Error fetching manager metadata:', err);
        return res.status(500).json({ 
            status: false, 
            message: "Error fetching metadata.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
};

module.exports = {
    getOwnerReport,
    getManagerReport,
    getOwnerMetadata,
    getManagerMetadata
};
