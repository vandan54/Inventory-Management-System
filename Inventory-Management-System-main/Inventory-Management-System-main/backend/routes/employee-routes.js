const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const { isOwner } = require('../middlewares/authorize-middleware');
const { createEmployee, updateEmployee, deleteEmployee, listEmployees } = require('../controllers/employee-controller');

const router = express.Router();

router.post('/', authMiddleware, isOwner, createEmployee);                                     
router.put('/:id', authMiddleware, isOwner, updateEmployee);                                 
router.delete('/:id', authMiddleware, isOwner, deleteEmployee);                              
router.get('/', authMiddleware, isOwner, listEmployees);                                     

module.exports = router;
