// src/controllers/ranking.controller.js
const { createResponse } = require('../utils/responseHelper');
const { logger } = require('../utils/logger');
const rankingService = require('../services/ranking.service');

// Lấy bảng xếp hạng sách
exports.getBookRankings = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const rankings = await rankingService.getBookRankings(limit);

        logger.info(`Đã lấy bảng xếp hạng với ${rankings.length} sách`);
        res.status(200).json(createResponse('success', 'Bảng xếp hạng sách đã được truy xuất thành công.', 200, rankings));
    } catch (err) {
        logger.error(`Lỗi khi lấy bảng xếp hạng sách: ${err.message}`, { meta: { request: req.query, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi lấy bảng xếp hạng sách.', 500, [], err.message));
    }
};

// Lấy danh sách tác giả xếp hạng cao
exports.getAuthorRankings = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;

        const authors = await rankingService.getAuthorRankings(limit);

        logger.info(`Đã lấy ${authors.length} tác giả xếp hạng cao`);
        res.status(200).json(createResponse('success', 'Danh sách tác giả xếp hạng cao đã được truy xuất thành công.', 200, authors));
    } catch (err) {
        logger.error(`Lỗi khi lấy danh sách tác giả xếp hạng cao: ${err.message}`, { meta: { request: req.query, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi lấy danh sách tác giả xếp hạng cao.', 500, [], err.message));
    }
};

// Cập nhật bảng xếp hạng (admin only)
exports.updateRankings = async (req, res) => {
    try {
        // Kiểm tra role admin (bạn có thể thêm middleware kiểm tra role)
        const result = await rankingService.updateRankings();

        logger.info(`Đã cập nhật bảng xếp hạng: ${JSON.stringify(result)}`);
        res.status(200).json(createResponse('success', 'Bảng xếp hạng đã được cập nhật thành công.', 200, [result]));
    } catch (err) {
        logger.error(`Lỗi khi cập nhật bảng xếp hạng: ${err.message}`, { meta: { error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi cập nhật bảng xếp hạng.', 500, [], err.message));
    }
};