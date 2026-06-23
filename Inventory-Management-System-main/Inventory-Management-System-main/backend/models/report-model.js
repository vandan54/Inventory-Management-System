const pool = require('../databases/db');

/**
 * Generates dynamic report data based on role-specific warehouse context and filters.
 */
const getReportData = async (businessId, targetWarehouseIds, reportType, filters, offset, limit) => {
    try {
        const { selectedProducts, startDate, endDate, sortBy, sortDir } = filters;

        // Base building blocks
        let selectQuery = '';
        let countQuery = '';
        let tablesAndJoins = '';
        // start with base filter
        let whereClause = `WHERE business_id = ? AND warehouse_id IN (${targetWarehouseIds.length ? targetWarehouseIds.join(',') : '0'})`;
        let queryParams = [businessId];
        let countParams = [businessId];

        // Specific filtering based on product selection
        if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
            whereClause += ` AND item_id IN (${selectedProducts.map(() => '?').join(',')})`;
            queryParams.push(...selectedProducts);
            countParams.push(...selectedProducts);
        }

        // Specific filtering based on date range helper
        const addDateFilter = (dateColumn) => {
            if (startDate) {
                whereClause += ` AND ${dateColumn} >= ?`;
                queryParams.push(`${startDate} 00:00:00`);
                countParams.push(`${startDate} 00:00:00`);
            }
            if (endDate) {
                whereClause += ` AND ${dateColumn} <= ?`;
                queryParams.push(`${endDate} 23:59:59`);
                countParams.push(`${endDate} 23:59:59`);
            }
        };

        // Switch based on report type to build exact query
        switch (reportType) {
            case 'STOCK_SUMMARY':
                selectQuery = `SELECT i.name as product, i.sku, i.category, inv.quantity as qty, w.name as warehouse`;
                tablesAndJoins = `
                    FROM inventory inv
                    JOIN items i ON inv.item_id = i.id
                    JOIN warehouses w ON inv.warehouse_id = w.id
                `;
                whereClause = `WHERE inv.business_id = ? AND i.is_deleted = 0 AND inv.warehouse_id IN (${targetWarehouseIds.join(',') || '0'})`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND inv.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                break;

            case 'EXPIRING':
            case 'EXPIRED':
                selectQuery = `SELECT i.name as product, i.sku, ti.batch_number as batch, ti.expiry_date as expiry, ti.quantity as qty, w.name as location`;
                tablesAndJoins = `
                    FROM tracked_inventory ti
                    JOIN items i ON ti.item_id = i.id
                    JOIN warehouses w ON ti.warehouse_id = w.id
                `;
                whereClause = `WHERE ti.business_id = ? AND ti.warehouse_id IN (${targetWarehouseIds.join(',') || '0'})`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND ti.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                if (reportType === 'EXPIRED') {
                    whereClause += ` AND ti.expiry_date < CURDATE()`;
                } else {
                    whereClause += ` AND ti.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)`;
                }
                addDateFilter('ti.expiry_date');
                break;

            case 'LOW_STOCK':
                selectQuery = `SELECT i.name as product, w.name as warehouse, inv.quantity as currentQty, i.reorder_level as reorderLevel, (i.reorder_level - inv.quantity) as shortage`;
                tablesAndJoins = `
                    FROM inventory inv
                    JOIN items i ON inv.item_id = i.id
                    JOIN warehouses w ON inv.warehouse_id = w.id
                `;
                whereClause = `WHERE inv.business_id = ? AND i.is_deleted = 0 AND inv.warehouse_id IN (${targetWarehouseIds.join(',') || '0'}) AND inv.quantity < i.reorder_level AND i.reorder_level > 0`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND inv.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                break;

            case 'SALES_REPORT':
            case 'RETURNS_REPORT':
                const txType = reportType === 'SALES_REPORT' ? 'OUT' : 'IN';
                selectQuery = `
                    SELECT DATE(t.created_at) as date, i.name as product, 
                    t.quantity as qty, w.name as warehouse, CONCAT(u.first_name, ' ', COALESCE(u.last_name, '')) as user
                `;
                tablesAndJoins = `
                    FROM inventory_transactions t
                    JOIN items i ON t.item_id = i.id
                    JOIN warehouses w ON t.warehouse_id = w.id
                    LEFT JOIN users u ON t.performed_by = u.id
                `;
                whereClause = `WHERE t.business_id = ? AND t.warehouse_id IN (${targetWarehouseIds.join(',') || '0'}) AND t.transaction_type = '${txType}'`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND t.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                addDateFilter('t.created_at');
                break;

            case 'TURNOVER':
                selectQuery = `
                    SELECT i.name as product, 
                           SUM(CASE WHEN t.transaction_type = 'IN' THEN t.quantity ELSE 0 END) as inbound,
                           SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END) as outbound,
                           CASE 
                                WHEN SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END) > 100 THEN 'High'
                                WHEN SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END) > 20 THEN 'Medium'
                                ELSE 'Slow'
                           END as turnoverRate,
                           'Active' as status
                `;
                tablesAndJoins = `
                    FROM inventory_transactions t
                    JOIN items i ON t.item_id = i.id
                `;
                whereClause = `WHERE t.business_id = ? AND t.warehouse_id IN (${targetWarehouseIds.join(',') || '0'})`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND t.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                addDateFilter('t.created_at');
                break;

            case 'BATCH_ANALYSIS':
                selectQuery = `
                    SELECT i.name as product, ti.batch_number as batchNo, 
                    MIN(DATE(ti.created_at)) as mfgDate, ti.expiry_date as expiryDate, 
                    COALESCE(ti.serial_number, 'N/A') as serialNo, ti.quantity as qtyInBatch
                `;
                tablesAndJoins = `
                    FROM tracked_inventory ti
                    JOIN items i ON ti.item_id = i.id
                `;
                whereClause = `WHERE ti.business_id = ? AND ti.warehouse_id IN (${targetWarehouseIds.join(',') || '0'})`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND ti.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                break;

            case 'WH_COMPARISON':
                selectQuery = `SELECT i.name as product, w.name as warehouse, inv.quantity as qty, 'Comparison' as total`;
                tablesAndJoins = `
                    FROM inventory inv
                    JOIN items i ON inv.item_id = i.id
                    JOIN warehouses w ON inv.warehouse_id = w.id
                `;
                whereClause = `WHERE inv.business_id = ? AND i.is_deleted = 0 AND inv.warehouse_id IN (${targetWarehouseIds.join(',') || '0'})`;
                if (selectedProducts && selectedProducts.length > 0 && !selectedProducts.includes('ALL')) {
                    whereClause += ` AND inv.item_id IN (${selectedProducts.map(() => '?').join(',')})`;
                }
                break;

            default:
                throw new Error("Invalid report type");
        }

        // --- Handle Sorting & Grouping ---
        let orderBy = '';
        if (sortBy) {
            const dir = (sortDir === 'desc') ? 'DESC' : 'ASC';
            if (sortBy === 'product') orderBy = `ORDER BY product ${dir}`;
            else if (sortBy === 'qty') orderBy = `ORDER BY qty ${dir}`;
            else if (sortBy === 'date' && (reportType === 'SALES_REPORT' || reportType === 'RETURNS_REPORT')) orderBy = `ORDER BY t.created_at ${dir}`;
            else orderBy = `ORDER BY product ${dir}`; 
        }

        // Special handling for reports that require GROUP BY
        let groupby = '';
        if (reportType === 'TURNOVER') {
            groupby = ` GROUP BY i.id, i.name`;
        } else if (reportType === 'BATCH_ANALYSIS') {
            groupby = ` GROUP BY i.id, i.name, ti.batch_number, ti.expiry_date, ti.serial_number, ti.quantity`;
        }

        // --- Execute Queries ---
        // 1. Get Total Count
        const countQueryExec = (reportType === 'TURNOVER' || reportType === 'BATCH_ANALYSIS')
            ? `SELECT COUNT(*) as total FROM (SELECT 1 ${tablesAndJoins} ${whereClause} ${groupby}) as derived`
            : `SELECT COUNT(*) as total ${tablesAndJoins} ${whereClause}`;
            
        const [countRows] = await pool.execute(countQueryExec, countParams);
        const totalCount = countRows[0].total;

        // 2. Get Results (Handle both paginated and full for Excel)
        let fullQuery = `${selectQuery} ${tablesAndJoins} ${whereClause} ${groupby} ${orderBy}`;
        let finalQueryParams = [...queryParams];

        if (limit && Number(limit) !== -1) {
            fullQuery += ` LIMIT ? OFFSET ?`;
            finalQueryParams.push(Number(limit), Number(offset));
        }
        
        const [resultRows] = await pool.query(fullQuery, finalQueryParams);

        // 3. Generate Overview Stats (Safely)
        let overview = { totalRecords: totalCount, type: reportType, generatedAt: new Date() };
        try {
            if (reportType === 'STOCK_SUMMARY') {
                const [statRows] = await pool.execute(`
                    SELECT SUM(inv.quantity) as totalQuantity, COUNT(DISTINCT inv.item_id) as totalUniqueItems
                    ${tablesAndJoins} ${whereClause}
                `, countParams);
                if (statRows.length) overview = { ...overview, ...statRows[0] };
            }
            else if (reportType === 'LOW_STOCK') {
                const [statRows] = await pool.execute(`
                    SELECT CAST(SUM(i.reorder_level - inv.quantity) AS CHAR) as totalShortageUnits
                    ${tablesAndJoins} ${whereClause}
                `, countParams);
                if (statRows.length) overview = { ...overview, ...statRows[0] };
            }
            else if (reportType === 'SALES_REPORT' || reportType === 'RETURNS_REPORT') {
                const [statRows] = await pool.execute(`
                    SELECT CAST(SUM(t.quantity) AS CHAR) as totalVolumeMoved
                    ${tablesAndJoins} ${whereClause}
                `, countParams);
                if (statRows.length) overview = { ...overview, ...statRows[0] };
            }
            else if (reportType === 'EXPIRING' || reportType === 'EXPIRED') {
                const [statRows] = await pool.execute(`
                    SELECT CAST(SUM(ti.quantity) AS CHAR) as totalUnitsAtRisk
                    ${tablesAndJoins} ${whereClause}
                `, countParams);
                if (statRows.length) overview = { ...overview, ...statRows[0] };
            }
            else if (reportType === 'WH_COMPARISON') {
                const [statRows] = await pool.execute(`
                    SELECT CAST(SUM(inv.quantity) AS CHAR) as totalSystemStock
                    ${tablesAndJoins} ${whereClause}
                `, countParams);
                if (statRows.length) overview = { ...overview, ...statRows[0] };
            }
        } catch (aggErr) {
            console.error("Aggregation stats failed:", aggErr.message);
        }

        return {
            results: resultRows,
            total: totalCount,
            overview: overview
        };

    } catch (err) {
        console.error("Report Generation Model Error:", err);
        throw err;
    }
};

/**
 * Fetches relevant products for dropdowns based on report context and warehouse access.
 */
const getReportProducts = async (businessId, targetWarehouseIds, reportType) => {
    try {
        let sql = `
            SELECT DISTINCT i.id as value, i.name as label, i.sku
            FROM items i
            INNER JOIN inventory inv ON i.id = inv.item_id
            WHERE i.business_id = ? AND i.is_deleted = 0 AND inv.quantity > 0
        `;
        const params = [businessId];

        if (targetWarehouseIds && targetWarehouseIds.length > 0) {
            sql += ` AND inv.warehouse_id IN (${targetWarehouseIds.map(id => Number(id)).join(',')})`;
        }

        if (reportType === 'EXPIRING' || reportType === 'EXPIRED') {
            sql += ` AND i.track_expiry = 1`;
        } else if (reportType === 'BATCH_ANALYSIS') {
            sql += ` AND i.track_batch = 1`;
        }

        sql += ` ORDER BY i.name ASC`;
        const [rows] = await pool.execute(sql, params);
        return rows;
    } catch (err) {
        throw err;
    }
};

module.exports = {
    getReportData,
    getReportProducts
};
