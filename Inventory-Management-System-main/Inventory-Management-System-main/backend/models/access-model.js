const pool = require('../databases/db');

// 1. Get minimalist warehouses list (for sidebar)
const getMinimalWarehouses = async (businessId) => {
    try {
        const sql = `SELECT id, name, city, state FROM warehouses WHERE business_id = ? AND is_deleted = 0 ORDER BY name ASC`;
        const [warehouses] = await pool.execute(sql, [businessId]);
        return warehouses;
    } catch (err) {
        throw err;
    }
};

// 2. Get Assigned Products
const getAssignedProducts = async (warehouseId, businessId, offset, limit, search) => {
    try {
        const keyword = `%${search}%`;
        const sql1 = `
            SELECT i.id, i.name, i.sku, i.category, iwa.is_active 
            FROM item_warehouse_access iwa
            JOIN items i ON i.id = iwa.item_id
            WHERE iwa.warehouse_id = ? AND i.business_id = ? AND i.is_deleted = 0
            AND (i.name LIKE ? OR i.sku LIKE ? OR i.category LIKE ?)
            LIMIT ${limit} OFFSET ${offset}
        `;
        const sql2 = `
            SELECT COUNT(*) AS total 
            FROM item_warehouse_access iwa
            JOIN items i ON i.id = iwa.item_id
            WHERE iwa.warehouse_id = ? AND i.business_id = ? AND i.is_deleted = 0
            AND (i.name LIKE ? OR i.sku LIKE ? OR i.category LIKE ?)
        `;

        const [products] = await pool.execute(sql1, [warehouseId, businessId, keyword, keyword, keyword]);
        const [count] = await pool.execute(sql2, [warehouseId, businessId, keyword, keyword, keyword]);

        return { products, total: count[0].total };
    } catch (err) {
        throw err;
    }
};

// 3. Get Assigned Users
const getAssignedUsers = async (warehouseId, businessId, offset, limit, search) => {
    try {
        const keyword = `%${search}%`;
        const sql1 = `
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.is_active
            FROM user_warehouse_access uwa
            JOIN users u ON u.id = uwa.user_id
            WHERE uwa.warehouse_id = ? AND u.business_id = ? AND u.is_deleted = 0
            AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.role LIKE ?)
            ORDER BY FIELD(u.role, 'manager', 'staff'), u.first_name ASC
            LIMIT ${limit} OFFSET ${offset}
        `;
        const sql2 = `
            SELECT COUNT(*) AS total
            FROM user_warehouse_access uwa
            JOIN users u ON u.id = uwa.user_id
            WHERE uwa.warehouse_id = ? AND u.business_id = ? AND u.is_deleted = 0
            AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.role LIKE ?)
        `;

        const [users] = await pool.execute(sql1, [warehouseId, businessId, keyword, keyword, keyword, keyword]);
        const [count] = await pool.execute(sql2, [warehouseId, businessId, keyword, keyword, keyword, keyword]);

        // Map first_name + last_name to name
        const mappedUsers = users.map(u => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            email: u.email,
            role: u.role,
            is_active: u.is_active
        }));

        return { users: mappedUsers, total: count[0].total };
    } catch (err) {
        throw err;
    }
};

// 4. Get Unassigned Products
const getUnassignedProducts = async (warehouseId, businessId, search) => {
    try {
        const keyword = `%${search}%`;
        const sql = `
            SELECT id, name, sku, category 
            FROM items 
            WHERE business_id = ? AND is_deleted = 0 AND is_locked = 0
            AND id NOT IN (
                SELECT item_id FROM item_warehouse_access WHERE warehouse_id = ?
            )
            AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)
            ORDER BY name ASC
        `;
        const [products] = await pool.execute(sql, [businessId, warehouseId, keyword, keyword, keyword]);
        return products;
    } catch (err) {
        throw err;
    }
};

// 5. Get Unassigned Users
const getUnassignedUsers = async (warehouseId, businessId, search) => {
    try {
        const keyword = `%${search}%`;

        // Staff can only be in one warehouse globally, Manager can be in multiple
        const sql = `
            SELECT id, first_name, last_name, email, role 
            FROM users 
            WHERE business_id = ? AND is_deleted = 0 AND is_active = 1 AND role IN ('manager', 'staff')
            AND id NOT IN (
                SELECT user_id FROM user_warehouse_access WHERE warehouse_id = ?
            )
            AND (
                role = 'manager' OR 
                (role = 'staff' AND id NOT IN (SELECT user_id FROM user_warehouse_access))
            )
            AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR role LIKE ?)
            ORDER BY FIELD(role, 'manager', 'staff'), first_name ASC
        `;
        const [users] = await pool.execute(sql, [businessId, warehouseId, keyword, keyword, keyword, keyword]);

        return users.map(u => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            email: u.email,
            role: u.role
        }));
    } catch (err) {
        throw err;
    }
};

// 6. Assign Products
const assignProducts = async (warehouseId, itemIds) => {
    if (!itemIds || itemIds.length === 0) return true;
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const placeholders = itemIds.map(() => "(?, ?, 1)").join(',');
        const sql = `INSERT IGNORE INTO item_warehouse_access (item_id, warehouse_id, is_active) VALUES ${placeholders}`;

        const values = [];
        itemIds.forEach(id => values.push(id, warehouseId));

        await connection.execute(sql, values);
        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 7. Assign Users
const assignUsers = async (warehouseId, userIds) => {
    if (!userIds || userIds.length === 0) return true;
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const placeholders = userIds.map(() => "(?, ?)").join(',');
        const sql = `INSERT IGNORE INTO user_warehouse_access (user_id, warehouse_id) VALUES ${placeholders}`;

        const values = [];
        userIds.forEach(id => values.push(id, warehouseId));

        await connection.execute(sql, values);
        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 8. Remove Product Checking Inventory
const removeAssignedProduct = async (warehouseId, itemId, businessId) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ? AND business_id = ? LIMIT 1`;
        const [inventoryResult] = await connection.execute(sql1, [warehouseId, itemId, businessId]);

        if (inventoryResult.length > 0 && inventoryResult[0].quantity > 0) {
            await connection.rollback();
            return {
                status: false,
                message: "Cannot remove product access. This warehouse still has stock for this product."
            };
        }

        const sql2 = `DELETE FROM item_warehouse_access WHERE warehouse_id = ? AND item_id = ?`;
        await connection.execute(sql2, [warehouseId, itemId]);

        await connection.commit();
        return { status: true };
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 9. Remove Assigned User
const removeAssignedUser = async (warehouseId, userId) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `DELETE FROM user_warehouse_access WHERE warehouse_id = ? AND user_id = ?`;
        await connection.execute(sql1, [warehouseId, userId]);

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

// 10. Toggle Product Status
const toggleProductStatus = async (warehouseId, itemId, newStatus) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE item_warehouse_access SET is_active = ? WHERE warehouse_id = ? AND item_id = ?`;
        await connection.execute(sql1, [newStatus ? 1 : 0, warehouseId, itemId]);

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
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
