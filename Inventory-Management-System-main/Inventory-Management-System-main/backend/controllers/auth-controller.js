const { hashPassword, verifyPassword } = require('../helpers/password-helper');
const { isUserExist, createOwner, getUser, setToken, updatePassword, isTokenValide, commitPasswordChange, fetchWarehouseAccessCount } = require('../models/auth-model');
const { signJWTToken } = require('../helpers/webToken-helper');
const { sendPasswordResetMail } = require('../helpers/email-helper');
const crypto = require('crypto');

const registerOwner = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: "Please provide both email and password to continue.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Please enter a valid email address.",
                alertTitle: "Invalid Email",
                alertType: "error",
                autoClose: true
            });
        }

        if (await isUserExist(email)) {
            return res.status(409).json({
                status: false,
                message: "An account with this email already exists. Please use a different email or try logging in.",
                alertTitle: "Email Already Registered",
                alertType: "warning",
                autoClose: true
            });
        }

        const hashedPassword = await hashPassword(password);

        if (await createOwner(email, hashedPassword)) {
            return res.status(201).json({
                status: true,
                message: "Your account has been created successfully. Redirecting to login...",
                alertTitle: "Registration Complete",
                alertType: "success",
                autoClose: false
            });
        }
    } catch (err) {
        console.error('Error registering owner:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body ?? {};

        if (!email || !password) {
            return res.status(400).json({
                status: false,
                message: "Please provide both email and password to continue.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const [result] = await getUser(email);
        const user = result[0];

        if (result.length === 0) {
            return res.status(404).json({
                status: false,
                message: `No account found with this email address.`,
                alertTitle: "Account Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (user.is_deleted === 1) {
            return res.status(409).json({
                status: false,
                message: "This account has been permanently deleted.",
                alertTitle: "Account Deleted",
                alertType: "error",
                autoClose: true
            });
        }

        if (user.is_active === 0) {
            return res.status(403).json({
                status: false,
                message: "Your account has been locked. Please contact owner or manager for assistance.",
                alertTitle: "Account Locked",
                alertType: "error",
                autoClose: true
            });
        }

        const isPasswordMatch = await verifyPassword(password, user.password_hash);

        if (!isPasswordMatch) {
            return res.status(401).json({
                status: false,
                message: "The password you entered is incorrect.",
                alertTitle: "Login Failed",
                alertType: "error",
                autoClose: true
            });
        }

        const accessToken = await signJWTToken(user);

        return res.status(200).json({
            status: true,
            message: "You have been successfully logged in.",
            alertTitle: "Welcome Back!",
            alertType: "success",
            autoClose: true,
            accessToken: accessToken
        });
    } catch (err) {
        console.error('Error logging in user:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body ?? {};

        if (!email) {
            return res.status(400).json({
                status: false,
                message: "Please provide both email and password to continue.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                status: false,
                message: "Please enter a valid email address.",
                alertTitle: "Invalid Email",
                alertType: "error",
                autoClose: true
            });
        }

        if (!await isUserExist(email)) {
            return res.status(409).json({
                status: false,
                message: `No account found with this email address.`,
                alertTitle: "Account Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        const token = crypto.randomBytes(32).toString('hex');

        if (!await setToken(email, token)) {
            return res.status(500).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                alertTitle: "Server Error",
                alertType: "error",
                autoClose: true
            });
        }

        await sendPasswordResetMail(email, token)

        return res.status(200).json({
            status: true,
            message: "Please check your mail box and reset your password through reset link",
            alertTitle: "Mail sent",
            alertType: "success",
            autoClose: true
        });

    } catch (err) {
        console.error('Error logging in user:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body ?? {};

        if (!token, !password) {
            return res.status(400).json({
                status: false,
                message: "Please provide both token and password to continue.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        if (!await isTokenValide(token)) {
            return res.status(401).json({
                status: false,
                message: "This password reset link has expired. Redirecting to forgot password...",
                alertTitle: "Link Expired",
                alertType: "error",
                autoClose: true
            });
        }

        const hashedPassword = await hashPassword(password);

        if (!await updatePassword(token, hashedPassword)) {
            return res.status(500).json({
                status: false,
                message: "Something went wrong. Please try again later.",
                alertTitle: "Server Error",
                alertType: "error",
                autoClose: true
            });
        }

        return res.status(200).json({
            status: true,
            message: "Your password has been reset successfully. Redirecting to login...",
            alertTitle: "Password Reset",
            alertType: "success",
            autoClose: true
        });
    } catch (err) {
        console.error('Error logging in user:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const replaceTempPassword = async (req, res) => {
    try {
        const { password } = req.body ?? {};
        const userId = req.user.userId;
        const email = req.user.userEmail;

        if (req.user.mustChangePassword === 0) {
            return res.status(403).json({
                status: false,
                message: "This action is only available for users who need to change their temporary password.",
                alertTitle: "Access Denied",
                alertType: "error",
                autoClose: true
            });
        }

        if (!password) {
            return res.status(400).json({
                status: false,
                message: "Please provide password to continue.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        const [rows] = await getUser(email);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "No account found associated with this session.",
                alertTitle: "Account Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        if (await verifyPassword(password, user.password_hash)) {
            return res.status(400).json({
                status: false,
                message: "Your new password cannot be the same as your old password. Please choose a different one.",
                alertTitle: "Similar Password",
                alertType: "warning",
                autoClose: true
            });
        }


        const hashedPassword = await hashPassword(password);

        if (await commitPasswordChange(userId, hashedPassword)) {
            return res.status(200).json({
                status: true,
                message: "Your password has been set successfully. Please login with your new password.",
                alertTitle: "Password Set",
                alertType: "success",
                autoClose: true
            });
        }
    } catch (err) {
        console.error('Error replacing temp password:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong. Please try again later.",
            alertTitle: "Server Error",
            alertType: "error",
            autoClose: true
        });
    }
}

const getWarehouseAccessStatus = async (req, res) => {
    try {
        const { userId, userRole } = req.user;

        // Owners always have access
        if (userRole === 'owner') {
            return res.status(200).json({
                status: true,
                hasAccess: true,
                message: "Owner has full access."
            });
        }

        // Check assigned warehouse count for managers and staff
        const accessCount = await fetchWarehouseAccessCount(userId);

        return res.status(200).json({
            status: true,
            hasAccess: accessCount > 0,
            count: accessCount,
            message: accessCount > 0 
                ? "Warehouse access verified." 
                : "No warehouse assignments found."
        });
    } catch (err) {
        console.error('Error checking warehouse access:', err);
        return res.status(500).json({
            status: false,
            message: "Something went wrong while checking access. Please try again.",
            alertTitle: "Access Check Failed",
            alertType: "error",
            autoClose: true
        });
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body ?? {};
        const userId = req.user.userId;
        const email = req.user.userEmail;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "Please provide current, new, and confirm passwords.",
                alertTitle: "Missing Information",
                alertType: "error",
                autoClose: true
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: false,
                message: "New password and confirm password do not match.",
                alertTitle: "Password Mismatch",
                alertType: "error",
                autoClose: true
            });
        }

        const [rows] = await getUser(email);
        const user = rows[0];

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "No account found associated with this session.",
                alertTitle: "Account Not Found",
                alertType: "error",
                autoClose: true
            });
        }

        const isPasswordMatch = await verifyPassword(currentPassword, user.password_hash);
        if (!isPasswordMatch) {
            return res.status(401).json({
                status: false,
                message: "The current password you entered is incorrect.",
                alertTitle: "Incorrect Password",
                alertType: "error",
                autoClose: true
            });
        }

        if (await verifyPassword(newPassword, user.password_hash)) {
            return res.status(400).json({
                status: false,
                message: "Your new password cannot be the same as your old password. Please choose a different one.",
                alertTitle: "Similar Password",
                alertType: "warning",
                autoClose: true
            });
        }

        const hashedPassword = await hashPassword(newPassword);

        if (await commitPasswordChange(userId, hashedPassword)) {
            return res.status(200).json({
                status: true,
                message: "Your password has been successfully updated.",
                alertTitle: "Password Updated",
                alertType: "success",
                autoClose: true
            });
        }
    } catch (err) {
        console.error('Error changing password:', err);
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
    registerOwner,
    loginUser,
    forgotPassword,
    resetPassword,
    getWarehouseAccessStatus,
    replaceTempPassword,
    changePassword
};