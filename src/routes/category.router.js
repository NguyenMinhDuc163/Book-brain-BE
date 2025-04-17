const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');

router.get('/api/categories', categoryController.getCategories);

module.exports = router;