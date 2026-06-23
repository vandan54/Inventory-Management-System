const express = require('express');
const authMiddleware = require('../middlewares/auth-middleware');
const { isOwner } = require('../middlewares/authorize-middleware');
const { createProduct, updateProduct, deleteProduct, listProducts } = require('../controllers/product-controller');

const router = express.Router();

router.post('/', authMiddleware, isOwner, createProduct);                                   //add product
router.put('/:id', authMiddleware, isOwner, updateProduct);                                 //update product
router.delete('/:id', authMiddleware, isOwner, deleteProduct);                              //delete product
router.get('/', authMiddleware, isOwner, listProducts);                                    //show list of product

module.exports = router;