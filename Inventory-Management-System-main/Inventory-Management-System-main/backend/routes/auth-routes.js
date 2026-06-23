//imports
const express = require('express');
const { registerOwner, loginUser, forgotPassword, resetPassword, replaceTempPassword, getWarehouseAccessStatus, changePassword } = require('../controllers/auth-controller');
const authMiddleware = require('../middlewares/auth-middleware');

//intialize
const router = express.Router();

router.post('/register-owner', registerOwner);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/setup-password', authMiddleware, replaceTempPassword);
router.post('/change-password', authMiddleware, changePassword);
router.get('/access-check', authMiddleware, getWarehouseAccessStatus);

module.exports = router;