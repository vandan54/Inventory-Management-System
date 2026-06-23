const pool = require("../databases/db");

const updateProfile = async (
    businessId,
    businessName,
    regitrationNo,
    taxId,
    businessType,
    industry,
    businessAddress,
    city,
    state,
    postalCode,
    businessContactEmail,
    businessContactPhone,
    country,
    firstName,
    middleName,
    lastName,
    userPhone,
    designation,
    dateOfBirth,
    gender,
    userAddress,
    userCity,
    userState,
    userPostalCode,
    userCountry
) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE businesses SET name = ?, registration_number = ?, tax_id = ?, business_type = ?, industry = ?, address = ?, city = ?, state = ?, postal_code = ?, contact_email = ?, contact_phone = ?, country = ?, profile_completed = ? WHERE id = ?`;
        const sql2 = `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, phone = ?, designation = ?, date_of_birth = ?, gender = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ?, profile_completed = ? WHERE business_id = ?`;

        const [result1] = await connection.execute(sql1, [
            businessName,
            regitrationNo,
            taxId,
            businessType,
            industry,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,
            1,
            businessId
        ]);

        const [result2] = await connection.execute(sql2, [
            firstName,
            middleName,
            lastName,
            userPhone,
            designation,
            dateOfBirth,
            gender,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry,
            1,
            businessId
        ]);


        if (result1.affectedRows === 0 || result2.affectedRows === 0) { throw new Error("One query failed to run"); }

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) { await connection.rollback(); }
        throw err;
    } finally {
        if (connection) { connection.release(); }
    }
}

const editProfile = async (
    userId,
    businessId,
    businessName,
    businessAddress,
    city,
    state,
    postalCode,
    businessContactEmail,
    businessContactPhone,
    country,
    firstName,
    middleName,
    lastName,
    userPhone,
    userAddress,
    userCity,
    userState,
    userPostalCode,
    userCountry
) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const sql1 = `UPDATE businesses SET name = ?, address = ?, city = ?, state = ?, postal_code = ?, contact_email = ?, contact_phone = ?, country = ? WHERE id = ?`;
        const sql2 = `UPDATE users SET first_name = ?, middle_name = ?, last_name = ?, phone = ?, address = ?, city = ?, state = ?, postal_code = ?, country = ? WHERE id = ?`;

        const [result1] = await connection.execute(sql1, [
            businessName,
            businessAddress,
            city,
            state,
            postalCode,
            businessContactEmail,
            businessContactPhone,
            country,
            businessId
        ]);

        const [result2] = await connection.execute(sql2, [
            firstName,
            middleName,
            lastName,
            userPhone,
            userAddress,
            userCity,
            userState,
            userPostalCode,
            userCountry,
            userId
        ]);

        if (result1.affectedRows === 0 || result2.affectedRows === 0) { throw new Error("One query failed to run"); }

        await connection.commit();
        return true;
    } catch (err) {
        if (connection) { await connection.rollback(); }
        throw err;
    } finally {
        if (connection) { connection.release(); }
    }
}

const getFullProfile = async (userId) => {
    try {
        const sql = `
            SELECT u.first_name, u.middle_name, u.last_name, u.phone, u.address, 
            u.city, u.state, u.postal_code, u.country, u.email, u.role,
            b.name as business_name, b.registration_number, b.tax_id, b.business_type, 
            b.industry, b.address as businessAddress, b.city as businessCity, b.state as businessState, 
            b.postal_code as businessPostalCode, b.contact_email as businessContactEmail, 
            b.contact_phone as businessContactPhone, b.country as businessCountry
            FROM users u
            JOIN businesses b ON u.business_id = b.id
            WHERE u.id = ?
        `;
        return await pool.execute(sql, [userId]);
    } catch (err) {
        throw err;
    }
}

module.exports = {
    updateProfile,
    editProfile,
    getFullProfile
};