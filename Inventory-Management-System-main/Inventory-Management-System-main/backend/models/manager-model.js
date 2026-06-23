const pool = require('../databases/db');

// 1. Get warehouses assigned to the manager
const getManagerWarehouses = async (businessId, managerId) => {
    try {
        const sql1 = `
            SELECT w.id, w.name, w.city, w.state
            FROM warehouses w
            INNER JOIN user_warehouse_access uwa ON w.id = uwa.warehouse_id
            WHERE uwa.user_id = ? AND w.business_id = ? AND w.is_deleted = 0 AND w.is_locked = 0
            ORDER BY w.name ASC
        `;
        const [rows] = await pool.execute(sql1, [managerId, businessId]);
        return rows;
    } catch (err) {
        throw err;
    }
};

// 2. Get list of staff assigned to a specific warehouse
const getWarehouseStaff = async (businessId, warehouseId, search, offset, limit) => {
    try {
        const keyword = `%${search}%`;

        const sql1 = `
            SELECT 
                u.id, 
                u.first_name,
                u.last_name, 
                u.email, 
                u.phone, 
                u.is_active
            FROM users u
            INNER JOIN user_warehouse_access uwa ON u.id = uwa.user_id
            WHERE uwa.warehouse_id = ? 
              AND u.business_id = ? 
              AND u.role = 'staff' 
              AND u.is_deleted = 0
              AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
            ORDER BY u.first_name ASC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const sql2 = `
            SELECT COUNT(*) as total 
            FROM users u
            INNER JOIN user_warehouse_access uwa ON u.id = uwa.user_id
            WHERE uwa.warehouse_id = ? 
              AND u.business_id = ? 
              AND u.role = 'staff' 
              AND u.is_deleted = 0
              AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
        `;

        const [rows] = await pool.execute(sql1, [warehouseId, businessId, keyword, keyword, keyword, keyword]);
        const [count] = await pool.execute(sql2, [warehouseId, businessId, keyword, keyword, keyword, keyword]);

        // Map first_name + last_name to name as per project standard
        const mappedStaff = rows.map(u => ({
            id: u.id,
            name: `${u.first_name || ''} ${u.last_name || ''}`.trim(),
            email: u.email,
            contact: u.phone,
            is_active: u.is_active
        }));

        return {
            staff: mappedStaff,
            total: count[0].total
        };
    } catch (err) {
        throw err;
    }
};

// 3. Toggle a staff member's active status
const toggleStaffStatus = async (staffId, businessId, status) => {
    let connection = null;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE users SET is_active = ? WHERE id = ? AND business_id = ? AND role = 'staff' AND is_deleted = 0`;
        const [result1] = await connection.execute(sql1, [status ? 1 : 0, staffId, businessId]);

        await connection.commit();
        return result1.affectedRows > 0;
    } catch (err) {
        if (connection) await connection.rollback();
        throw err;
    } finally {
        if (connection) connection.release();
    }
};

module.exports = {
    getManagerWarehouses,
    getWarehouseStaff,
    toggleStaffStatus
};
