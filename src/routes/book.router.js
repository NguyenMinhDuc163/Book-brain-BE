const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');

// Các route liên quan đến sách
router.get('/api/v1/books', bookController.getBooks);
router.get('/api/v1/books/search', bookController.searchBooks);
router.get('/api/v1/books/trending', bookController.getTrendingBooks);
router.get('/api/v1/books/chapters', bookController.getChaptersByBookId);
router.get('/api/v1/books/:bookId', bookController.getBookById);
router.get('/api/v1/chapters/:chapterId', bookController.getChapterById);
router.post('/api/v1/books/:bookId/views', bookController.increaseBookViews);
router.get('/api/v1/detailBook', bookController.getBookDetail);
module.exports = router;