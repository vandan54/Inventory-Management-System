const bcrypt = require('bcryptjs');
const generatePassword = require('generate-password');

const hashPassword = async (password) => {
    return await bcrypt.hash(String(password), 10);
}

const verifyPassword = async (password, hashedPassword) => {
    return await bcrypt.compare(String(password), hashedPassword);
}

const createPassword = () => {
    return generatePassword.generate({
        length: 8,
        numbers: true,
        symbols: true,
        uppercase: true,
        lowercase: true,
        strict: true,
        excludeAmbiguous: false,
        exclude: '|`~!^&*()_+={}[]\\:";\'<>?,./~'
    });
}
module.exports = {
    hashPassword,
    verifyPassword,
    createPassword
};