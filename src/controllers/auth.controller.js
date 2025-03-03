const { createResponse } = require('../utils/responseHelper');
const { logger } = require('../utils/logger');
const UserService = require('../services/user.service'); // Dịch vụ xử lý logic
const jwt = require('jsonwebtoken');
// Đăng ký người dùng
exports.registerUser = async (req, res) => {
    try {
        const response = await UserService.registerUser(req.body);
        return res.status(response.status).json(createResponse(response.statusText, response.message, response.status, response.data));
    } catch (err) {
        logger.error(`Lỗi khi đăng ký người dùng: ${err.message}`, { meta: { request: req.body, error: err } });
        return res.status(500).json(createResponse('fail', 'Lỗi khi đăng ký người dùng.', 500, [], err.message));
    }
};


// Đăng nhập người dùng
exports.loginUser = async (req, res) => {
    try {
        const response = await UserService.loginUser(req.body);
        return res.status(response.status).json(createResponse(response.statusText, response.message, response.status, response.data));
    } catch (err) {
        logger.error(`Lỗi khi đăng nhập: ${err.message}`, { meta: { request: req.body, error: err } });
        return res.status(500).json(createResponse('fail', 'Lỗi khi đăng nhập.', 500, [], err.message));
    }
};


// Cập nhật thông tin người dùng
exports.updateUserInfo = async (req, res) => {
    try {
        const userId = parseInt(req.body.id, 10); // Chuyển ID từ string sang số nguyên

        // Kiểm tra ID hợp lệ
        if (!userId || isNaN(userId) || userId <= 0) {
            throw new Error('ID người dùng không hợp lệ.');
        }

        const response = await UserService.updateUserInfo(userId, req.body);

        return res.status(response.status).json(createResponse(
            response.statusText,
            response.message,
            response.status,
            response.data
        ));
    } catch (err) {
        logger.error(`Lỗi khi cập nhật thông tin người dùng: ${err.message}`, { meta: { request: req.body, error: err } });

        return res.status(500).json(createResponse(
            'fail',
            'Lỗi khi cập nhật thông tin người dùng.',
            500,
            [],
            err.message
        ));
    }
};

