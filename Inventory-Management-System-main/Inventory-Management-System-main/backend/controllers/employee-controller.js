const { addEmployee, editEmployee, removeEmployee, getEmployees, getEmployeeByID } = require('../models/employee-model');
const { getUser, isUserExist } = require('../models/auth-model');
const { hashPassword, verifyPassword, createPassword } = require('../helpers/password-helper');
const { sendNewEmployeeMail } = require('../helpers/email-helper');

const createEmployee = async (req, res) => {
    try {
        const { first_name, middle_name, last_name, email, phone, role, gender, date_of_birth, address, city, state, postal_code, country } = req.body ?? {};

        const requiredField = ['first_name', 'last_name', 'email', 'phone', 'role', 'gender', 'date_of_birth', 'address', 'city', 'state', 'postal_code', 'country'];
        const missingFields = requiredField.filter(fields =>
            req.body[fields] == null ||
            req.body[fields] === ""
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please provide: ${missingFields.join(', ')}`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Please provide a valid email address.",
                alertTitle: "Invalid Email",
                alertType: "error",
                autoClose: true
            });
        }

        if (await isUserExist(email)) {
            return res.status(409).json({
                status: false,
                message: "This email address is already registered.",
                alertTitle: "Email Exists",
                alertType: "error",
                autoClose: true
            });
        }

        const tempPassword = createPassword();
        const hashedPassword = await hashPassword(tempPassword);

        if (await addEmployee(req.user.userbusinessId, first_name, middle_name, last_name, email, phone, role, gender, date_of_birth, address, city, state, postal_code, country, hashedPassword)) {

            console.log(`\n\nEmail: ${email}\nPassword: ${tempPassword}\n\n`);

            await sendNewEmployeeMail(email, tempPassword, role, req.user.userName, req.user.businessName);

            return res.status(201).json({
                status: true,
                message: "Employee has been added successfully. A temporary password will be provided.",
                alertTitle: "Employee Created",
                alertType: "success",
                autoClose: true
            });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const updateEmployee = async (req, res) => {
    try {
        const { first_name, middle_name, last_name, phone, role, gender, date_of_birth, address, city, state, postal_code, country, is_active } = req.body ?? {};

        const requiredField = ['first_name', 'last_name', 'phone', 'role', 'gender', 'date_of_birth', 'address', 'city', 'state', 'postal_code', 'country', 'is_active'];
        const missingFields = requiredField.filter(fields =>
            req.body[fields] == null ||
            req.body[fields] === ""
        );

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: false,
                message: `Please provide: ${missingFields.join(', ')}`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        if (!await getEmployeeByID(req.params.id, req.user.userbusinessId)) {
            return res.status(404).json({
                status: false,
                message: "Employee not found. Please check the ID and try again.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await editEmployee(req.params.id, req.user.userbusinessId, first_name, middle_name, last_name, phone, role, gender, date_of_birth, address, city, state, postal_code, country, is_active)) {
            return res.status(200).json({
                status: true,
                message: "Employee details have been updated successfully.",
                alertTitle: "Employee Updated",
                alertType: "success",
                autoClose: true
            });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const deleteEmployee = async (req, res) => {
    try {
        const { password } = req.body ?? {};

        if (!password) {
            return res.status(400).json({
                status: false,
                message: `Please provide your password to confirm removal.`,
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const [result] = await getUser(req.user.userEmail);
        const user = result[0];

        if (!await verifyPassword(password, user.password_hash)) {
            return res.status(401).json({
                status: false,
                message: "Incorrect password. Please try again.",
                alertTitle: "Authentication Failed",
                alertType: "error",
                autoClose: true
            });
        }

        if (!await getEmployeeByID(req.params.id, req.user.userbusinessId)) {
            return res.status(404).json({
                status: false,
                message: "Employee not found. Please check the ID and try again.",
                alertTitle: "Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await removeEmployee(req.params.id, req.user.userbusinessId)) {
            return res.status(200).json({
                status: true,
                message: "Employee has been successfully removed from the system.",
                alertTitle: "Employee Deleted",
                alertType: "success",
                autoClose: true
            });
        }
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const listEmployees = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const search = req.query.search || '';

        const offset = (page - 1) * limit;

        const result = await getEmployees(req.user.userbusinessId, offset, limit, search);

        return res.json({
            status: true,
            data: result.employees,
            pagination: {
                currentPage: page,
                limit: limit,
                total: result.total,
                totalPages: Math.ceil(result.total / limit)
            }
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

module.exports = {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    listEmployees
};
