require('dotenv').config();
const jwt = require('jsonwebtoken');

const signJWTToken = (user) => {
    return jwt.sign({
        userId: user.id,
        userName: user.first_name + " " + user.last_name,
        userbusinessId: user.business_id,
        businessName: user.business_name,
        userEmail: user.email,
        userRole: user.role,
        isProfileCompleted: user.profile_completed,
        mustChangePassword: user.must_change_password
    }, process.env.JWT_SECRETE_KEY, {
        expiresIn: "2h"
    });
}

const verifyJWTToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRETE_KEY);
}

module.exports = {
    signJWTToken,
    verifyJWTToken
};