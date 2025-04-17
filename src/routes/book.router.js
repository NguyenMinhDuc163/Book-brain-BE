const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');

// Các route liên quan đến sách
router.get('/api/books', bookController.getBooks);
router.get('/api/books/search', bookController.searchBooks);
router.get('/api/books/trending', bookController.getTrendingBooks);
router.get('/api/books/:bookId', bookController.getBookById);
router.get('/api/books/:bookId/chapters', bookController.getChaptersByBookId);
router.get('/api/chapters/:chapterId', bookController.getChapterById);
router.post('/api/books/:bookId/views', bookController.increaseBookViews);
module.exports = router;