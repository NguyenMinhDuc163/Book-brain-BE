// src/routes/ranking.router.js
const express = require('express');
const router = express.Router();
const rankingController = require('../controllers/ranking.controller');

// Lấy bảng xếp hạng sách
router.get('/api/v1/rankings/books', rankingController.getBookRankings);

// Lấy danh sách tác giả xếp hạng cao
router.get('/api/v1/rankings/authors', rankingController.getAuthorRankings);

// Cập nhật bảng xếp hạng (admin only)
router.post('/api/v1/rankings/update', rankingController.updateRankings);

module.exports = router;