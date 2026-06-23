const dashboardModel = require('../models/dashboard-model');

const getOwnerDashboard = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;

        const [stats, logs, alerts] = await Promise.all([
            dashboardModel.getOwnerStats(businessId),
            dashboardModel.getOwnerLogs(businessId),
            dashboardModel.getOwnerAlerts(businessId)
        ]);

        return res.status(200).json({ status: true, data: { stats, logs, alerts } });
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

const getManagerDashboard = async (req, res) => {
    try {
        const businessId = req.user.userbusinessId;
        const userId = req.user.userId;

        // Retrieve authorized warehouses from model
        const allowedWarehouses = await dashboardModel.getManagerAllowedWarehouses(businessId, userId);

        let stats, logs, alerts;

        if (allowedWarehouses.length === 0) {
            stats = { myWarehouses: 0, myStaff: 0, itemsInStock: 0, lowStock: 0 };
            logs = [];
            alerts = [];
        } else {
            const warehouseIds = allowedWarehouses.map(w => w.warehouse_id);
            [stats, logs, alerts] = await Promise.all([
                dashboardModel.getManagerStats(businessId, userId, warehouseIds),
                dashboardModel.getManagerLogs(businessId, warehouseIds),
                dashboardModel.getManagerAlerts(businessId, warehouseIds)
            ]);
        }

        return res.status(200).json({
            status: true,
            data: { stats, logs, alerts, assignedWarehouses: allowedWarehouses }
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

module.exports = {
    getOwnerDashboard,
    getManagerDashboard
};
