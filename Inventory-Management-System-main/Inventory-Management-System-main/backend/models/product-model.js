const pool = require('../databases/db');

const addProduct = async (businessId, name, sku, unit, category, description, reorder_level, track_batch, track_expiry, track_serial) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `INSERT INTO items (business_id, name, sku, unit, category, description, reorder_level, track_batch, track_expiry, track_serial, is_deleted, is_locked) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`;

        const [result1] = await connection.execute(sql1, [businessId, name, sku, unit, category, description, reorder_level, track_batch, track_expiry, track_serial]);

        await connection.commit();

        return true;
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        throw err;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

const editProduct = async (id, businessId, name, sku, unit, category, description, reorder_level, is_locked) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE items SET name = ?, sku = ?, unit = ?, category = ?, description = ?, reorder_level = ?, is_locked = ? WHERE id = ? AND business_id = ?`;

        const [result1] = await connection.execute(sql1, [name, sku, unit, category, description, reorder_level, is_locked, id, businessId])

        await connection.commit();

        return true;
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        throw err;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

const removeProduct = async (id, businessId) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE items SET is_deleted = ? WHERE id = ? AND business_id = ? AND is_deleted = ?`;

        const [result1] = await connection.execute(sql1, [1, id, businessId, 0]);

        await connection.commit();

        return true;
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        throw err;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

const getProduct = async (businessId, offset, limit, search) => {
    try {
        const keyword = `%${search}%`;

        const sql1 = `SELECT * FROM items WHERE business_id = ? AND is_deleted = ? AND (name LIKE ? OR sku LIKE ? OR unit LIKE ? OR category LIKE ? OR description LIKE ?) LIMIT ${limit} OFFSET ${offset}`;
        const sql2 = `SELECT COUNT(*) AS total FROM items WHERE business_id = ? AND is_deleted = ? AND (name LIKE ? OR sku LIKE ? OR unit LIKE ? OR category LIKE ? OR description LIKE ?)`;

        const [warehouses] = await pool.execute(sql1, [businessId, 0, keyword, keyword, keyword, keyword, keyword]);
        const [count] = await pool.execute(sql2, [businessId, 0, keyword, keyword, keyword, keyword, keyword]);

        return { warehouses, total: count[0].total };
    } catch (err) {
        throw err;
    }
}

const getProductByID = async (id, businessId) => {
    try {
        const sql = `SELECT * FROM items WHERE id = ? AND business_id = ? AND is_deleted = ?`;

        const [result] = await pool.execute(sql, [id, businessId, 0]);

        if (result.length === 1) { return true; }

        return false;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    addProduct,
    editProduct,
    removeProduct,
    getProduct,
    getProductByID
};