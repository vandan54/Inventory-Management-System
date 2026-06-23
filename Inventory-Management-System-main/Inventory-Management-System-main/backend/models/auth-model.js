const pool = require('../databases/db');

const isUserExist = async (email) => {
    try {
        const sql = `SELECT * FROM users WHERE email = ?`;

        const [rows] = await pool.execute(sql, [email]);

        return rows.length > 0 ? true : false;
    } catch (err) {
        throw err;
    }
}

const createOwner = async (email, hashedPassword) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `INSERT INTO businesses (name) VALUES (?)`;
        const sql2 = `INSERT INTO users (business_id, email, password_hash, role, must_change_password) VALUES (?, ?, ?, 'owner', 0)`;
        const sql3 = `INSERT INTO activity_logs (business_id, user_id, action, entity_type, entity_id, metadata) VALUES (?, ?, 'CREATE', 'USER', ?, ?);`;

        const metadata = JSON.stringify({
            role: 'owner',
            email: email,
            registration_date: new Date().toISOString()
        });

        const [result1] = await connection.execute(sql1, [email.split('@')[0] + '_' + Date.now()]);
        const [result2] = await connection.execute(sql2, [result1.insertId, email, hashedPassword]);
        const [result3] = await connection.execute(sql3, [result1.insertId, result2.insertId, result2.insertId, metadata]);

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

const getUser = async (email) => {
    try {
        const sql = `SELECT users.*, businesses.name AS business_name FROM users JOIN businesses ON users.business_id = businesses.id WHERE users.email = ?;`;

        return await pool.execute(sql, [email]);
    } catch (err) {
        throw err;
    }
}

const setToken = async (email, token) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `SELECT id FROM users WHERE email = ?`;
        const sql2 = `DELETE FROM password_reset_tokens WHERE user_id = ? OR used = ? OR expires_at < NOW()`;
        const sql3 = `INSERT INTO password_reset_tokens (user_id, token) VALUES (?, ?)`;

        const [result1] = await connection.execute(sql1, [email]);
        const [result2] = await connection.execute(sql2, [result1[0].id, 1]);
        const [result3] = await connection.execute(sql3, [result1[0].id, token]);

        await connection.commit();

        return true;
    } catch (err) {
        if (connection) { await connection.rollback(); }
    } finally {
        if (connection) { connection.release(); }
    }
}

const updatePassword = async (token, hashedPassword) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `SELECT user_id FROM password_reset_tokens WHERE token = ?`;
        const sql2 = `UPDATE users SET password_hash = ? WHERE id = ?`;
        const sql3 = `UPDATE password_reset_tokens SET used = ? WHERE token = ?`;

        const [result1] = await connection.execute(sql1, [token]);
        await connection.execute(sql2, [hashedPassword, result1[0].user_id]);
        await connection.execute(sql3, [1, token]);

        await connection.commit();

        return true;
    } catch (err) {
        if (connection) { await connection.rollback(); }
    } finally {
        if (connection) { connection.release(); }
    }
}

const isTokenValide = async (token) => {
    try {
        const sql = `SELECT * FROM password_reset_tokens WHERE token = ? AND expires_at > NOW() AND used = ?`;

        const [result] = await pool.execute(sql, [token, 0]);

        if (result.length === 1) {
            return true;
        }
    } catch (err) {
        throw err;
    }
}

const commitPasswordChange = async (userId, hashedPassword) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?`;

        const [result1] = await connection.execute(sql1, [hashedPassword, userId]);

        if (result1.affectedRows === 0) {
            throw new Error('User not found or update failed');
        }

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

const fetchWarehouseAccessCount = async (userId) => {
    try {
        const sql = `SELECT COUNT(*) AS accessCount FROM user_warehouse_access WHERE user_id = ?;`;
        const [rows] = await pool.execute(sql, [userId]);
        return rows[0].accessCount;
    } catch (err) {
        throw err;
    }
}

module.exports = {
    isUserExist,
    createOwner,
    getUser,
    setToken,
    updatePassword,
    isTokenValide,
    commitPasswordChange,
    fetchWarehouseAccessCount
};