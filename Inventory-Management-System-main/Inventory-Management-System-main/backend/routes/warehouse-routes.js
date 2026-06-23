const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const { isOwner } = require('../middlewares/authorize-middleware');
const { createWarehouse, updateWarehouse, deleteWarehouse, listWarehouses } = require('../controllers/warehouse-controller');

const router = express.Router();

router.post('/', authMiddleware, isOwner, createWarehouse);                //add warehouse
router.put('/:id', authMiddleware, isOwner, updateWarehouse);              //update warehouse
router.delete('/:id', authMiddleware, isOwner, deleteWarehouse);           //delete warehouse
router.get('/', authMiddleware, isOwner, listWarehouses);                  //show list of warehouse

module.exports = router;