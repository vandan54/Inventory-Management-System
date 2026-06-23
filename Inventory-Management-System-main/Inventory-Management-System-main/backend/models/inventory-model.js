const pool = require('../databases/db');

// 1. Get staff's assigned warehouse info
const getStaffWarehouse = async (userId) => {
    try {
        const sql = `
            SELECT w.id, w.name, w.city, w.state
            FROM user_warehouse_access uwa
            JOIN warehouses w ON w.id = uwa.warehouse_id
            WHERE uwa.user_id = ? AND w.is_deleted = 0 AND w.is_locked = 0
            LIMIT 1
        `;
        const [rows] = await pool.execute(sql, [userId]);
        return rows.length > 0 ? rows[0] : null;
    } catch (err) {
        throw err;
    }
};

// 2. Get products assigned to a warehouse (that staff can move)
const getWarehouseProducts = async (warehouseId, businessId) => {
    try {
        const sql = `
            SELECT i.id, i.name, i.sku, i.category, i.unit, i.track_batch, i.track_expiry, i.track_serial
            FROM item_warehouse_access iwa
            JOIN items i ON i.id = iwa.item_id
            WHERE iwa.warehouse_id = ? AND i.business_id = ? AND i.is_deleted = 0 AND i.is_locked = 0 AND iwa.is_active = 1
            ORDER BY i.name ASC
        `;
        const [rows] = await pool.execute(sql, [warehouseId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

// 3. Get transaction reasons by type (IN or OUT)
const getReasonsByType = async (transactionType, businessId) => {
    try {
        const sql = `
            SELECT id, name
            FROM transaction_reasons
            WHERE transaction_type = ? AND is_active = 1 AND (business_id IS NULL OR business_id = ?)
            ORDER BY name ASC
        `;
        const [rows] = await pool.execute(sql, [transactionType, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

// 4. Get existing batches for a product in a warehouse (for Stock OUT)
const getProductBatches = async (itemId, warehouseId, businessId) => {
    try {
        const sql = `
            SELECT id, batch_number, expiry_date, quantity
            FROM tracked_inventory
            WHERE item_id = ? AND warehouse_id = ? AND business_id = ? AND quantity > 0
            ORDER BY expiry_date ASC, created_at ASC
        `;
        const [rows] = await pool.execute(sql, [itemId, warehouseId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

// 5. Get existing serials for a product in a warehouse (for Stock OUT)
const getProductSerials = async (itemId, warehouseId, businessId) => {
    try {
        const sql = `
            SELECT id, serial_number
            FROM tracked_inventory
            WHERE item_id = ? AND warehouse_id = ? AND business_id = ? AND quantity > 0 AND serial_number IS NOT NULL
            ORDER BY serial_number ASC
        `;
        const [rows] = await pool.execute(sql, [itemId, warehouseId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

// 6. Stock IN — Quantity Only
const stockInQuantity = async (businessId, itemId, warehouseId, quantity, reasonId, performedBy) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // sql1: Update inventory snapshot
        const sql1 = `
            INSERT INTO inventory (business_id, item_id, warehouse_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `;
        await connection.execute(sql1, [businessId, itemId, warehouseId, quantity]);

        // sql2: Record the transaction
        const sql2 = `
            INSERT INTO inventory_transactions (business_id, item_id, warehouse_id, transaction_type, source, reason_id, quantity, performed_by)
            VALUES (?, ?, ?, 'IN', 'TRANSACTION', ?, ?, ?)
        `;
        await connection.execute(sql2, [businessId, itemId, warehouseId, reasonId, quantity, performedBy]);

        // sql3: (future) activity_logs entry

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 7. Stock IN — Batch (with optional expiry)
const stockInBatch = async (businessId, itemId, warehouseId, quantity, reasonId, batchNumber, expiryDate, performedBy) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // sql1: Update inventory snapshot
        const sql1 = `
            INSERT INTO inventory (business_id, item_id, warehouse_id, quantity)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `;
        await connection.execute(sql1, [businessId, itemId, warehouseId, quantity]);

        // sql2: Upsert tracked_inventory for this batch
        const sql2 = `
            INSERT INTO tracked_inventory (business_id, warehouse_id, item_id, batch_number, expiry_date, quantity)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)
        `;
        await connection.execute(sql2, [businessId, warehouseId, itemId, batchNumber, expiryDate || null, quantity]);

        // sql3: Record the transaction
        const sql3 = `
            INSERT INTO inventory_transactions (business_id, item_id, warehouse_id, transaction_type, source, reason_id, quantity, batch_number, expiry_date, performed_by)
            VALUES (?, ?, ?, 'IN', 'TRANSACTION', ?, ?, ?, ?, ?)
        `;
        await connection.execute(sql3, [businessId, itemId, warehouseId, reasonId, quantity, batchNumber, expiryDate || null, performedBy]);

        // sql4: (future) activity_logs entry

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 8. Stock IN — Serial
const stockInSerial = async (businessId, itemId, warehouseId, reasonId, serialNumber, performedBy) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // sql1: Update inventory snapshot (qty always 1 for serial)
        const sql1 = `
            INSERT INTO inventory (business_id, item_id, warehouse_id, quantity)
            VALUES (?, ?, ?, 1)
            ON DUPLICATE KEY UPDATE quantity = quantity + 1
        `;
        await connection.execute(sql1, [businessId, itemId, warehouseId]);

        // sql2: Insert tracked_inventory for this serial
        const sql2 = `
            INSERT INTO tracked_inventory (business_id, warehouse_id, item_id, serial_number, quantity)
            VALUES (?, ?, ?, ?, 1)
        `;
        await connection.execute(sql2, [businessId, warehouseId, itemId, serialNumber]);

        // sql3: Record the transaction
        const sql3 = `
            INSERT INTO inventory_transactions (business_id, item_id, warehouse_id, transaction_type, source, reason_id, quantity, serial_number, performed_by)
            VALUES (?, ?, ?, 'IN', 'TRANSACTION', ?, 1, ?, ?)
        `;
        await connection.execute(sql3, [businessId, itemId, warehouseId, reasonId, serialNumber, performedBy]);

        // sql4: (future) activity_logs entry

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 9. Stock OUT — Quantity Only
const stockOutQuantity = async (businessId, itemId, warehouseId, quantity, reasonId, performedBy) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // sql1: Check current stock
        const sql1 = `SELECT quantity FROM inventory WHERE business_id = ? AND item_id = ? AND warehouse_id = ?`;
        const [check] = await connection.execute(sql1, [businessId, itemId, warehouseId]);

        if (check.length === 0 || check[0].quantity < quantity) {
            await connection.rollback();
            return { success: false, message: 'Insufficient stock available.' };
        }

        // sql2: Deduct from inventory snapshot
        const sql2 = `UPDATE inventory SET quantity = quantity - ? WHERE business_id = ? AND item_id = ? AND warehouse_id = ?`;
        await connection.execute(sql2, [quantity, businessId, itemId, warehouseId]);

        // sql3: Record the transaction
        const sql3 = `
            INSERT INTO inventory_transactions (business_id, item_id, warehouse_id, transaction_type, source, reason_id, quantity, performed_by)
            VALUES (?, ?, ?, 'OUT', 'TRANSACTION', ?, ?, ?)
        `;
        await connection.execute(sql3, [businessId, itemId, warehouseId, reasonId, quantity, performedBy]);

        // sql4: (future) activity_logs entry

        await connection.commit();
        return { success: true };
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 10. Stock OUT — Batch (remove from specific batches)
// batchSelections = [{ trackedId: 1, quantity: 50 }, { trackedId: 3, quantity: 20 }]
const stockOutBatch = async (businessId, itemId, warehouseId, reasonId, batchSelections, performedBy) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        let totalRemoved = 0;

        for (const sel of batchSelections) {
            if (sel.quantity <= 0) continue;

            // sql1: Check batch stock
            const sql1 = `SELECT id, batch_number, expiry_date, quantity FROM tracked_inventory WHERE id = ? AND business_id = ?`;
            const [batchRows] = await connection.execute(sql1, [sel.trackedId, businessId]);

            if (batchRows.length === 0 || batchRows[0].quantity < sel.quantity) {
                await connection.rollback();
                return { success: false, message: `Insufficient stock in batch ${batchRows[0]?.batch_number || sel.trackedId}.` };
            }

            const batch = batchRows[0];

            // sql2: Deduct from tracked_inventory
            const sql2 = `UPDATE tracked_inventory SET quantity = quantity - ? WHERE id = ?`;
            await connection.execute(sql2, [sel.quantity, sel.trackedId]);

            // sql3: Delete row if quantity becomes 0
            const sql3 = `DELETE FROM tracked_inventory WHERE id = ? AND quantity <= 0`;
            await connection.execute(sql3, [sel.trackedId]);

            // sql4: Record the transaction per batch
            const sql4 = `
                INSERT INTO inventory_transactions (business_id, item_id, warehouse_id, transaction_type, source, reason_id, quantity, batch_number, expiry_date, performed_by)
                VALUES (?, ?, ?, 'OUT', 'TRANSACTION', ?, ?, ?, ?, ?)
            `;
            await connection.execute(sql4, [businessId, itemId, warehouseId, reasonId, sel.quantity, batch.batch_number, batch.expiry_date, performedBy]);

            totalRemoved += sel.quantity;
        }

        // sql5: Deduct total from inventory snapshot
        const sql5 = `UPDATE inventory SET quantity = quantity - ? WHERE business_id = ? AND item_id = ? AND warehouse_id = ?`;
        await connection.execute(sql5, [totalRemoved, businessId, itemId, warehouseId]);

        // sql6: (future) activity_logs entry

        await connection.commit();
        return { success: true };
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 11. Stock OUT — Serial (remove selected serial numbers)
// serialIds = [1, 3, 5] (tracked_inventory ids)
const stockOutSerial = async (businessId, itemId, warehouseId, reasonId, serialIds, performedBy) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        for (const serialId of serialIds) {
            // sql1: Get serial info
            const sql1 = `SELECT id, serial_number FROM tracked_inventory WHERE id = ? AND business_id = ? AND quantity > 0`;
            const [serialRows] = await connection.execute(sql1, [serialId, businessId]);

            if (serialRows.length === 0) {
                await connection.rollback();
                return { success: false, message: `Serial item not found or already removed.` };
            }

            const serial = serialRows[0];

            // sql2: Delete serial from tracked_inventory (qty is always 1)
            const sql2 = `DELETE FROM tracked_inventory WHERE id = ?`;
            await connection.execute(sql2, [serialId]);

            // sql3: Record the transaction
            const sql3 = `
                INSERT INTO inventory_transactions (business_id, item_id, warehouse_id, transaction_type, source, reason_id, quantity, serial_number, performed_by)
                VALUES (?, ?, ?, 'OUT', 'TRANSACTION', ?, 1, ?, ?)
            `;
            await connection.execute(sql3, [businessId, itemId, warehouseId, reasonId, serial.serial_number, performedBy]);
        }

        // sql4: Deduct total from inventory snapshot
        const sql4 = `UPDATE inventory SET quantity = quantity - ? WHERE business_id = ? AND item_id = ? AND warehouse_id = ?`;
        await connection.execute(sql4, [serialIds.length, businessId, itemId, warehouseId]);

        // sql5: (future) activity_logs entry

        await connection.commit();
        return { success: true };
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 12. Get staff's recent movement history (Paginated)
const getStaffRecentLogs = async (userId, businessId, offset, limit) => {
    try {
        const warehouse = await getStaffWarehouse(userId);
        if (!warehouse) return { logs: [], total: 0 };

        const sql1 = `
            SELECT 
                t.id,
                UNIX_TIMESTAMP(t.created_at) * 1000 as created_at,
                t.transaction_type as type,
                t.quantity,
                t.batch_number,
                t.serial_number,
                i.name as product_name,
                i.sku,
                i.unit,
                w.name as warehouse_name,
                r.name as reason
            FROM inventory_transactions t
            JOIN items i ON i.id = t.item_id
            JOIN warehouses w ON w.id = t.warehouse_id
            JOIN transaction_reasons r ON r.id = t.reason_id
            WHERE t.performed_by = ? 
              AND t.business_id = ?
              AND t.warehouse_id = ?
            ORDER BY t.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const sql2 = `
            SELECT COUNT(*) AS total
            FROM inventory_transactions
            WHERE performed_by = ? 
              AND business_id = ?
              AND warehouse_id = ?
        `;

        const [logs] = await pool.execute(sql1, [userId, businessId, warehouse.id]);
        const [count] = await pool.execute(sql2, [userId, businessId, warehouse.id]);

        return { logs, total: count[0].total };
    } catch (err) {
        throw err;
    }
};

module.exports = {
    getStaffWarehouse,
    getWarehouseProducts,
    getReasonsByType,
    getProductBatches,
    getProductSerials,
    stockInQuantity,
    stockInBatch,
    stockInSerial,
    stockOutQuantity,
    stockOutBatch,
    stockOutSerial,
    getStaffRecentLogs
};
