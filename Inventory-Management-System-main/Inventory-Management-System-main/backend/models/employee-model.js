const pool = require('../databases/db');

const addEmployee = async (businessId, firstName, middleName, lastName, email, phone, role, gender, dateOfBirth, address, city, state, postalCode, country, hashedPassword) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `INSERT INTO users (business_id, first_name, middle_name, last_name, email, phone, role, gender, date_of_birth, address, city, state, postal_code, country, password_hash, must_change_password, is_active, profile_completed, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0)`;

        const [result1] = await connection.execute(sql1, [businessId, firstName, middleName, lastName, email, phone, role, gender, dateOfBirth, address, city, state, postalCode, country, hashedPassword]);

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

const editEmployee = async (id, businessId, firstName, middleName, lastName, phone, role, gender, dateOfBirth, address, city, state, postalCode, country, isActive) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, phone = ?, role = ?, gender = ?, date_of_birth = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, is_active = ? WHERE id = ? AND business_id = ? AND is_deleted = 0`;

        const [result1] = await connection.execute(sql1, [firstName, middleName, lastName, phone, role, gender, dateOfBirth, address, city, state, postalCode, country, isActive, id, businessId]);

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

const removeEmployee = async (id, businessId) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE users SET is_deleted = 1, is_active = 0 WHERE id = ? AND business_id = ? AND role != 'owner' AND is_deleted = 0`;

        const [result1] = await connection.execute(sql1, [id, businessId]);

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
}

const getEmployees = async (businessId, offset, limit, search) => {
    try {
        const keyword = `%${search}%`;

        const sql1 = `SELECT id, first_name, middle_name, last_name, email, phone, role, gender, date_of_birth, address, city, state, postal_code, country, is_active FROM users 
        WHERE business_id = ? AND role != 'owner' AND is_deleted = 0 AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR role LIKE ? OR address LIKE ? OR city LIKE ? OR state LIKE ? OR postal_code LIKE ? OR country LIKE ? OR phone LIKE ?) LIMIT ${limit} OFFSET ${offset}`;

        const sql2 = `SELECT COUNT(*) AS total FROM users WHERE business_id = ? AND role != 'owner' AND is_deleted = 0 AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR role LIKE ? OR address LIKE ? OR city LIKE ? OR state LIKE ? OR postal_code LIKE ? OR country LIKE ? OR phone LIKE ?)`;

        const [employees] = await pool.execute(sql1, [businessId, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword]);
        const [count] = await pool.execute(sql2, [businessId, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword, keyword]);

        return { employees, total: count[0].total };
    } catch (err) {
        throw err;
    }
}

const getEmployeeByID = async (id, businessId) => {
    try {
        const sql = `SELECT * FROM users WHERE id = ? AND business_id = ? AND role != 'owner' AND is_deleted = 0`;
        const [result] = await pool.execute(sql, [id, businessId]);

        if (result.length === 1) { return true; }
        return false;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    addEmployee,
    editEmployee,
    removeEmployee,
    getEmployees,
    getEmployeeByID
};
