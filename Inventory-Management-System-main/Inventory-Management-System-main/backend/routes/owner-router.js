const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const {isOwner} = require('../middlewares/authorize-middleware'); 
const { completeProfile, editProfileOwner, getProfile } = require('../controllers/owner-controller');

const router = express.Router();

router.post('/complete-profile', authMiddleware, isOwner, completeProfile);
router.post('/edit-profile', authMiddleware, isOwner, editProfileOwner);
router.get('/profile', authMiddleware, getProfile);

module.exports = router;