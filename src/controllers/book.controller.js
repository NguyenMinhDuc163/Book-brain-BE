const { createResponse } = require('../utils/responseHelper');
const { logger } = require('../utils/logger');
const {
    getBooks,
    searchBooks,
    getTrendingBooks,
    getBookById,
    getChaptersByBookId,
    getChapterById,
    increaseBookViews
} = require('../services/book.service');
exports.getBooks = async (req, res) => {
    try {
        const filters = {
            category_id: req.query.category_id,
            author_id: req.query.author_id,
            status: req.query.status,
            limit: req.query.limit ? parseInt(req.query.limit) : 10,
            offset: req.query.page ? (parseInt(req.query.page) - 1) * (req.query.limit ? parseInt(req.query.limit) : 10) : 0
        };

        const books = await getBooks(filters);

        if (books.length > 0) {
            logger.info('Danh sách sách đã được truy xuất thành công.');
            res.status(200).json(createResponse('success', 'Danh sách sách đã được truy xuất thành công.', 200, books));
        } else {
            logger.warn('Không tìm thấy sách nào.');
            res.status(200).json(createResponse('fail', 'Không tìm thấy sách nào.', 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi truy xuất danh sách sách: ${err.message}`, { meta: { request: req.query, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi truy xuất danh sách sách.', 500, [], err.message));
    }
};

exports.searchBooks = async (req, res) => {
    const { keyword, limit } = req.query;

    if (!keyword) {
        logger.warn('Thiếu từ khóa tìm kiếm.');
        return res.status(200).json(createResponse('fail', 'Vui lòng cung cấp từ khóa tìm kiếm.', 400, []));
    }

    try {
        const books = await searchBooks(keyword, limit ? parseInt(limit) : 10);

        if (books.length > 0) {
            logger.info(`Tìm thấy ${books.length} sách với từ khóa "${keyword}".`);
            res.status(200).json(createResponse('success', `Tìm thấy ${books.length} sách với từ khóa "${keyword}".`, 200, books));
        } else {
            logger.warn(`Không tìm thấy sách nào với từ khóa "${keyword}".`);
            res.status(200).json(createResponse('fail', `Không tìm thấy sách nào với từ khóa "${keyword}".`, 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi tìm kiếm sách: ${err.message}`, { meta: { request: req.query, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi tìm kiếm sách.', 500, [], err.message));
    }
};

exports.getTrendingBooks = async (req, res) => {
    const { limit } = req.query;

    try {
        const books = await getTrendingBooks(limit ? parseInt(limit) : 10);

        if (books.length > 0) {
            logger.info('Danh sách sách hot đã được truy xuất thành công.');
            res.status(200).json(createResponse('success', 'Danh sách sách hot đã được truy xuất thành công.', 200, books));
        } else {
            logger.warn('Không tìm thấy sách hot nào.');
            res.status(200).json(createResponse('fail', 'Không tìm thấy sách hot nào.', 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi truy xuất danh sách sách hot: ${err.message}`, { meta: { request: req.query, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi truy xuất danh sách sách hot.', 500, [], err.message));
    }
};


exports.getBookById = async (req, res) => {
    const { bookId } = req.params;

    if (!bookId) {
        logger.warn('Thiếu ID sách.');
        return res.status(200).json(createResponse('fail', 'Vui lòng cung cấp ID sách.', 400, []));
    }

    try {
        const book = await getBookById(bookId);

        if (book) {
            logger.info(`Đã lấy thông tin chi tiết sách với ID: ${bookId}`);
            res.status(200).json(createResponse('success', 'Thông tin chi tiết sách đã được truy xuất thành công.', 200, book));
        } else {
            logger.warn(`Không tìm thấy sách với ID: ${bookId}`);
            res.status(200).json(createResponse('fail', 'Không tìm thấy sách.', 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi lấy thông tin chi tiết sách: ${err.message}`, { meta: { bookId, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi lấy thông tin chi tiết sách.', 500, [], err.message));
    }
};

exports.getChaptersByBookId = async (req, res) => {
    const { bookId } = req.params;

    if (!bookId) {
        logger.warn('Thiếu ID sách.');
        return res.status(200).json(createResponse('fail', 'Vui lòng cung cấp ID sách.', 400, []));
    }

    try {
        const chapters = await getChaptersByBookId(bookId);

        if (chapters.length > 0) {
            logger.info(`Đã lấy danh sách ${chapters.length} chương của sách ID: ${bookId}`);
            res.status(200).json(createResponse('success', 'Danh sách chương đã được truy xuất thành công.', 200, chapters));
        } else {
            logger.warn(`Không tìm thấy chương nào cho sách với ID: ${bookId}`);
            res.status(200).json(createResponse('fail', 'Không tìm thấy chương nào cho sách này.', 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi lấy danh sách chương: ${err.message}`, { meta: { bookId, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi lấy danh sách chương.', 500, [], err.message));
    }
};

exports.getChapterById = async (req, res) => {
    const { chapterId } = req.params;

    if (!chapterId) {
        logger.warn('Thiếu ID chương.');
        return res.status(200).json(createResponse('fail', 'Vui lòng cung cấp ID chương.', 400, []));
    }

    try {
        const chapter = await getChapterById(chapterId);

        if (chapter) {
            logger.info(`Đã lấy nội dung chương với ID: ${chapterId}`);
            res.status(200).json(createResponse('success', 'Nội dung chương đã được truy xuất thành công.', 200, chapter));
        } else {
            logger.warn(`Không tìm thấy chương với ID: ${chapterId}`);
            res.status(200).json(createResponse('fail', 'Không tìm thấy chương.', 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi lấy nội dung chương: ${err.message}`, { meta: { chapterId, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi lấy nội dung chương.', 500, [], err.message));
    }
};

exports.increaseBookViews = async (req, res) => {
    const { bookId } = req.params;

    if (!bookId) {
        logger.warn('Thiếu ID sách.');
        return res.status(200).json(createResponse('fail', 'Vui lòng cung cấp ID sách.', 400, []));
    }

    try {
        const result = await increaseBookViews(bookId);

        if (result) {
            logger.info(`Đã tăng lượt xem cho sách ID: ${bookId}, lượt xem hiện tại: ${result.views}`);
            res.status(200).json(createResponse('success', 'Đã tăng lượt xem cho sách.', 200, result));
        } else {
            logger.warn(`Không tìm thấy sách với ID: ${bookId} để tăng lượt xem`);
            res.status(200).json(createResponse('fail', 'Không tìm thấy sách.', 404, []));
        }
    } catch (err) {
        logger.error(`Lỗi khi tăng lượt xem sách: ${err.message}`, { meta: { bookId, error: err } });
        res.status(200).json(createResponse('fail', 'Lỗi khi tăng lượt xem sách.', 500, [], err.message));
    }
};