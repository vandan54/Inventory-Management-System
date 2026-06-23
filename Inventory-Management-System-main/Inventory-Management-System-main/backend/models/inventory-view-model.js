const pool = require('../databases/db');

// 1. Get Warehouses based on role scopes
const getAdminWarehouses = async (businessId) => {
    try {
        const sql1 = `
            SELECT id as value, name as label, city as location 
            FROM warehouses 
            WHERE business_id = ? AND is_deleted = 0
            ORDER BY name ASC
        `;
        const [rows] = await pool.execute(sql1, [businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

const getManagerWarehouses = async (businessId, userId) => {
    try {
        const sql1 = `
            SELECT w.id as value, w.name as label, w.city as location 
            FROM warehouses w
            INNER JOIN user_warehouse_access uwa ON w.id = uwa.warehouse_id
            WHERE uwa.user_id = ? AND w.business_id = ? AND w.is_deleted = 0 AND w.is_locked = 0
            ORDER BY w.name ASC
        `;
        const [rows] = await pool.execute(sql1, [userId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

const getStaffWarehouse = async (businessId, userId) => {
    try {
        const sql1 = `
            SELECT w.id as value, w.name as label, w.city as location 
            FROM warehouses w
            INNER JOIN user_warehouse_access uwa ON w.id = uwa.warehouse_id
            WHERE uwa.user_id = ? AND w.business_id = ? AND w.is_deleted = 0 AND w.is_locked = 0
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql1, [userId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

// 2. Get Unified Inventory List (for Owner/Manager/Staff views)
const getInventoryList = async (businessId, warehouseIds, filters, offset, limit) => {
    try {
        const { search = '', trackingTypes = [], statuses = [] } = filters;
        const keyword = `%${search}%`;

        if (!warehouseIds || warehouseIds.length === 0) {
            return { inventory: [], total: 0 };
        }

        let sql1 = `
            SELECT 
                i.id, i.name, i.sku, i.category, i.unit, i.reorder_level,
                (CASE 
                    WHEN i.track_serial = 1 THEN 'SERIAL'
                    WHEN i.track_expiry = 1 THEN 'BATCH_EXPIRY'
                    WHEN i.track_batch = 1 THEN 'BATCH'
                    ELSE 'QTY'
                END) as tracking_type,
                SUM(inv.quantity) as total_qty,
                (CASE 
                    WHEN i.track_expiry = 1 THEN (
                        SELECT CASE WHEN COUNT(*) > 0 THEN 1 ELSE 0 END 
                        FROM tracked_inventory t 
                        WHERE t.item_id = i.id 
                          AND t.warehouse_id IN (${warehouseIds.join(',')})
                          AND t.expiry_date IS NOT NULL 
                          AND t.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
                          AND t.quantity > 0
                    )
                    ELSE 0
                END) as is_expiring
            FROM items i
            JOIN inventory inv ON i.id = inv.item_id
            JOIN warehouses w ON w.id = inv.warehouse_id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv.warehouse_id IN (${warehouseIds.join(',')})
        `;

        const params = [businessId];

        if (search) {
            sql1 += ` AND (i.name LIKE ? OR i.sku LIKE ? OR i.category LIKE ?)`;
            params.push(keyword, keyword, keyword);
        }

        if (trackingTypes.length > 0) {
            const conditions = [];
            if (trackingTypes.includes('SERIAL')) conditions.push('i.track_serial = 1');
            if (trackingTypes.includes('BATCH')) conditions.push('i.track_batch = 1 AND i.track_expiry = 0');
            if (trackingTypes.includes('BATCH_EXPIRY')) conditions.push('i.track_expiry = 1');
            if (trackingTypes.includes('QTY')) conditions.push('i.track_serial = 0 AND i.track_batch = 0 AND i.track_expiry = 0');
            
            if (conditions.length > 0) {
                sql1 += ` AND (${conditions.join(' OR ')})`;
            }
        }

        sql1 += ` GROUP BY i.id`;

        // Handle Status Alerts
        if (statuses.length > 0) {
            const havingClauses = [];
            if (statuses.includes('LOW_STOCK')) havingClauses.push(`SUM(inv.quantity) <= i.reorder_level`);
            if (statuses.includes('EXPIRING')) havingClauses.push(`is_expiring = 1`);
            
            if (havingClauses.length > 0) {
                sql1 += ` HAVING ${havingClauses.join(' OR ')}`;
            }
        }

        sql1 += ` ORDER BY i.name ASC LIMIT ${limit} OFFSET ${offset}`;

        const [rows] = await pool.execute(sql1, params);

        const sql2 = `
            SELECT COUNT(DISTINCT i.id) as total
            FROM items i
            JOIN inventory inv ON i.id = inv.item_id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv.warehouse_id IN (${warehouseIds.join(',')})
            ${search ? 'AND (i.name LIKE ? OR i.sku LIKE ? OR i.category LIKE ?)' : ''}
        `;
        const countParams = search ? [businessId, keyword, keyword, keyword] : [businessId];
        const [count] = await pool.execute(sql2, countParams);

        return { inventory: rows, total: count[0].total };
    } catch (err) {
        throw err;
    }
};

// 3. Get Inventory KPIs
const getInventoryKPIs = async (businessId, warehouseIds, filters = {}) => {
    try {
        if (!warehouseIds || warehouseIds.length === 0) {
             return { totalProducts: 0, lowStockAlerts: 0, expiringSoon: 0 };
        }

        const { search = '', trackingTypes = [], statuses = [] } = filters;
        const keyword = `%${search}%`;

        let filterSql = '';
        const paramsCount = [businessId];

        if (search) {
            filterSql += ` AND (i.name LIKE ? OR i.sku LIKE ? OR i.category LIKE ?)`;
            paramsCount.push(keyword, keyword, keyword);
        }

        if (trackingTypes.length > 0) {
            const conditions = [];
            if (trackingTypes.includes('SERIAL')) conditions.push('i.track_serial = 1');
            if (trackingTypes.includes('BATCH')) conditions.push('i.track_batch = 1 AND i.track_expiry = 0');
            if (trackingTypes.includes('BATCH_EXPIRY')) conditions.push('i.track_expiry = 1');
            if (trackingTypes.includes('QTY')) conditions.push('i.track_serial = 0 AND i.track_batch = 0 AND i.track_expiry = 0');
            
            if (conditions.length > 0) {
                filterSql += ` AND (${conditions.join(' OR ')})`;
            }
        }

        const sql1 = `
            SELECT 
                COUNT(DISTINCT i.id) as total_products,
                SUM(CASE WHEN inv_total.total_qty <= i.reorder_level THEN 1 ELSE 0 END) as low_stock_alerts
            FROM items i
            JOIN (
                SELECT item_id, SUM(quantity) as total_qty 
                FROM inventory 
                WHERE warehouse_id IN (${warehouseIds.join(',')}) 
                GROUP BY item_id
            ) inv_total ON i.id = inv_total.item_id
            WHERE i.business_id = ? AND i.is_deleted = 0 ${filterSql}
        `;
        
        const [kpi] = await pool.execute(sql1, paramsCount);

        let sql2 = `
            SELECT COUNT(DISTINCT item_id) as expiring_soon
            FROM tracked_inventory t
            JOIN items i ON i.id = t.item_id
            WHERE i.business_id = ? 
              AND t.warehouse_id IN (${warehouseIds.join(',')}) 
              AND t.expiry_date IS NOT NULL 
              AND t.expiry_date <= DATE_ADD(CURRENT_DATE, INTERVAL 7 DAY)
              AND t.quantity > 0
              ${filterSql}
        `;
        const [expiry] = await pool.execute(sql2, paramsCount);

        return {
            totalProducts: kpi[0].total_products || 0,
            lowStockAlerts: kpi[0].low_stock_alerts || 0,
            expiringSoon: expiry[0].expiring_soon || 0
        };
    } catch (err) {
        throw err;
    }
};

// 4. Get Item Details (Only loaded when the user opens the modal)
const getItemDetails = async (businessId, itemId, warehouseIds) => {
    try {
        if (!warehouseIds || warehouseIds.length === 0) {
            return { breakdown: [], details: [] };
        }

        // Qty breakdown by warehouse
        const sql1 = `
            SELECT w.name as location, inv.quantity as qty
            FROM inventory inv
            JOIN warehouses w ON w.id = inv.warehouse_id
            WHERE inv.item_id = ? AND inv.business_id = ? AND inv.warehouse_id IN (${warehouseIds.join(',')})
        `;
        const [breakdown] = await pool.execute(sql1, [itemId, businessId]);

        // Tracked info (batches, serials, expiry)
        const sql2 = `
            SELECT t.id, t.batch_number as batch, DATE_FORMAT(t.expiry_date, '%Y-%m-%d') as expiry, t.serial_number as serial, t.quantity as qty, w.name as location
            FROM tracked_inventory t
            JOIN warehouses w ON w.id = t.warehouse_id
            WHERE t.item_id = ? AND t.business_id = ? AND t.quantity > 0 AND t.warehouse_id IN (${warehouseIds.join(',')})
        `;
        const [details] = await pool.execute(sql2, [itemId, businessId]);

        return { breakdown, details };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    getAdminWarehouses,
    getManagerWarehouses,
    getStaffWarehouse,
    getInventoryList,
    getInventoryKPIs,
    getItemDetails
};
