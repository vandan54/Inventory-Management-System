const pool = require('../databases/db');

const addWarehouse = async (businessId, name, address, city, state, postal_code, country) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `INSERT INTO warehouses (business_id, name, address, city, state, postal_code, country, is_deleted, is_locked) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`;

        const [result1] = await connection.execute(sql1, [businessId, name, address, city, state, postal_code, country]);

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

const editWarehouse = async (id, businessId, name, address, city, state, postalCode, country, isLocked) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE warehouses SET name = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, is_locked = ? WHERE id = ? AND business_id = ?`;

        const [result1] = await connection.execute(sql1, [name, address, city, state, postalCode, country, isLocked, id, businessId])

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

const removeWarehouse = async (id, businessId) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE warehouses SET is_deleted = ? WHERE id = ? AND business_id = ? AND is_deleted = ?`;

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

const getWarehouse = async (businessId, offset, limit, search) => {
    try {
        const keyword = `%${search}%`;

        const sql1 = `SELECT * FROM warehouses WHERE business_id = ? AND is_deleted = ? AND (name LIKE ? OR address LIKE ? OR city LIKE ? OR state LIKE ? OR postal_code LIKE ? OR country LIKE ?) LIMIT ${limit} OFFSET ${offset}`;
        const sql2 = `SELECT COUNT(*) AS total FROM warehouses WHERE business_id = ? AND is_deleted = ? AND (name LIKE ? OR address LIKE ? OR city LIKE ? OR state LIKE ? OR postal_code LIKE ? OR country LIKE ?)`;

        const [warehouses] = await pool.execute(sql1, [businessId, 0, keyword, keyword, keyword, keyword, keyword, keyword]);
        const [count] = await pool.execute(sql2, [businessId, 0, keyword, keyword, keyword, keyword, keyword, keyword]);

        return { warehouses, total: count[0].total };
    } catch (err) {
        throw err;
    }
}

const getWarehouseByID = async (id, businessId) => {
    try {
        const sql = `SELECT * FROM warehouses WHERE id = ? AND business_id = ? AND is_deleted = ?`;

        const [result] = await pool.execute(sql, [id, businessId, 0]);

        if (result.length === 1) { return true; }

        return false;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    addWarehouse,
    editWarehouse,
    removeWarehouse,
    getWarehouse,
    getWarehouseByID
};