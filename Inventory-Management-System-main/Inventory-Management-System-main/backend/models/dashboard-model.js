const pool = require('../databases/db');

// --- OWNER ---

const getOwnerStats = async (businessId) => {
    try {
        const [[{ wCount }]] = await pool.execute('SELECT COUNT(*) as wCount FROM warehouses WHERE business_id = ? AND is_deleted = 0', [businessId]);
        const [[{ eCount }]] = await pool.execute('SELECT COUNT(*) as eCount FROM users WHERE business_id = ? AND role != "owner" AND is_deleted = 0', [businessId]);
        const [[{ pCount }]] = await pool.execute('SELECT COUNT(*) as pCount FROM items WHERE business_id = ? AND is_deleted = 0', [businessId]);

        // Low stock items across all warehouses (sum of inventory per item)
        const [[{ lsCount }]] = await pool.execute(`
            SELECT COUNT(DISTINCT i.id) as lsCount
            FROM items i
            JOIN (SELECT item_id, SUM(quantity) as total_qty FROM inventory GROUP BY item_id) inv_total ON i.id = inv_total.item_id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv_total.total_qty <= i.reorder_level AND i.reorder_level > 0
        `, [businessId]);

        return { warehouses: wCount, employees: eCount, products: pCount, lowStock: lsCount };
    } catch (err) {
        throw err;
    }
};

const getOwnerLogs = async (businessId) => {
    try {
        // Fetch inventory transactions only (activity_logs is for future use)
        const [txRows] = await pool.execute(`
            SELECT t.id, t.transaction_type, t.quantity, i.name as item_name, w.name as warehouse_name, u.first_name, u.last_name, u.role, t.created_at
            FROM inventory_transactions t
            JOIN items i ON t.item_id = i.id
            JOIN warehouses w ON t.warehouse_id = w.id
            LEFT JOIN users u ON t.performed_by = u.id
            WHERE t.business_id = ?
            ORDER BY t.created_at DESC LIMIT 10
        `, [businessId]);

        const logs = [];

        txRows.forEach(row => {
            const by = row.first_name ? `${row.first_name} ${row.last_name}` : 'System';
            logs.push({
                type: row.transaction_type,
                timestamp: new Date(row.created_at).getTime(),
                created_at: row.created_at,
                text: `Stock ${row.transaction_type}: ${row.item_name} (${row.quantity} units)`,
                meta: `${row.warehouse_name} · By ${by}`,
                source: 'inventory'
            });
        });

        return logs;
    } catch (err) {
        throw err;
    }
};

const getOwnerAlerts = async (businessId) => {
    try {
        const [rows] = await pool.execute(`
            SELECT i.name, w.name as warehouse, inv.quantity as stock, i.reorder_level as reorder
            FROM inventory inv
            JOIN items i ON inv.item_id = i.id
            JOIN warehouses w ON inv.warehouse_id = w.id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv.quantity <= i.reorder_level AND i.reorder_level > 0
            ORDER BY (i.reorder_level - inv.quantity) DESC LIMIT 5
        `, [businessId]);

        return rows.map(r => ({ ...r, badge: r.stock <= (r.reorder * 0.25) ? 'red' : 'yellow' }));
    } catch (err) {
        throw err;
    }
};

// --- MANAGER ---

const getManagerStats = async (businessId, userId, warehouseIds) => {
    try {
        if (!warehouseIds || warehouseIds.length === 0) return { myWarehouses: 0, myStaff: 0, itemsInStock: 0, lowStock: 0 };

        const wCount = warehouseIds.length;

        const [[{ eCount }]] = await pool.execute(`
            SELECT COUNT(DISTINCT u.id) as eCount 
            FROM users u 
            JOIN user_warehouse_access uwa ON u.id = uwa.user_id 
            WHERE u.business_id = ? AND u.role = 'staff' AND u.is_deleted = 0 AND uwa.warehouse_id IN (${warehouseIds.join(',')})
        `, [businessId]);

        const [[{ pCount }]] = await pool.execute(`
            SELECT COUNT(DISTINCT item_id) as pCount 
            FROM inventory 
            WHERE business_id = ? AND warehouse_id IN (${warehouseIds.join(',')}) AND quantity > 0
        `, [businessId]);

        const [[{ lsCount }]] = await pool.execute(`
            SELECT COUNT(DISTINCT i.id) as lsCount
            FROM items i
            JOIN (SELECT item_id, SUM(quantity) as total_qty FROM inventory WHERE warehouse_id IN (${warehouseIds.join(',')}) GROUP BY item_id) inv_total ON i.id = inv_total.item_id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv_total.total_qty <= i.reorder_level AND i.reorder_level > 0
        `, [businessId]);

        return { myWarehouses: wCount, myStaff: eCount, itemsInStock: pCount, lowStock: lsCount };
    } catch (err) {
        throw err;
    }
};

const getManagerLogs = async (businessId, warehouseIds) => {
    try {
        if (!warehouseIds || warehouseIds.length === 0) return [];

        const [txRows] = await pool.execute(`
            SELECT t.id, t.transaction_type, t.quantity, i.name as item_name, w.name as warehouse_name, u.first_name, u.last_name, u.role, t.created_at
            FROM inventory_transactions t
            JOIN items i ON t.item_id = i.id
            JOIN warehouses w ON t.warehouse_id = w.id
            LEFT JOIN users u ON t.performed_by = u.id
            WHERE t.business_id = ? AND t.warehouse_id IN (${warehouseIds.join(',')})
            ORDER BY t.created_at DESC LIMIT 10
        `, [businessId]);

        const logs = [];
        txRows.forEach(row => {
            const by = row.first_name ? `${row.first_name} ${row.last_name}` : 'System';
            logs.push({
                type: row.transaction_type,
                timestamp: new Date(row.created_at).getTime(),
                created_at: row.created_at,
                text: `Stock ${row.transaction_type}: ${row.item_name} (${row.quantity} units)`,
                meta: `${row.warehouse_name} · By ${by}`,
                source: 'inventory'
            });
        });

        return logs;
    } catch (err) {
        throw err;
    }
};

const getManagerAlerts = async (businessId, warehouseIds) => {
    try {
        if (!warehouseIds || warehouseIds.length === 0) return [];

        const [rows] = await pool.execute(`
            SELECT i.name, w.name as warehouse, inv.quantity as stock, i.reorder_level as reorder
            FROM inventory inv
            JOIN items i ON inv.item_id = i.id
            JOIN warehouses w ON inv.warehouse_id = w.id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv.quantity <= i.reorder_level AND i.reorder_level > 0 AND inv.warehouse_id IN (${warehouseIds.join(',')})
            ORDER BY (i.reorder_level - inv.quantity) DESC LIMIT 5
        `, [businessId]);

        return rows.map(r => ({ ...r, badge: r.stock <= (r.reorder * 0.25) ? 'red' : 'yellow' }));
    } catch (err) {
        throw err;
    }
};

const getManagerAllowedWarehouses = async (businessId, userId) => {
    try {
        const [rows] = await pool.execute(`
            SELECT w.id as warehouse_id, w.name 
            FROM warehouses w 
            JOIN user_warehouse_access uwa ON w.id = uwa.warehouse_id 
            WHERE uwa.user_id = ? AND w.business_id = ? AND w.is_deleted = 0 AND w.is_locked = 0
        `, [userId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

module.exports = {
    getOwnerStats,
    getOwnerLogs,
    getOwnerAlerts,
    getManagerStats,
    getManagerLogs,
    getManagerAlerts,
    getManagerAllowedWarehouses
};
