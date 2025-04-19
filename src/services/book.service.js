const pool = require('../configs/db.config');

const getBooks = async (filters = {}) => {
    let query = `
        SELECT b.book_id, b.title, b.url, b.image_url, b.excerpt, b.views, b.status, b.rating,
               a.author_id, a.name as author_name,
               c.category_id, c.name as category_name
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.author_id
        LEFT JOIN categories c ON b.category_id = c.category_id
        WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Thêm điều kiện lọc theo thể loại
    if (filters.category_id) {
        query += ` AND b.category_id = $${paramCount++}`;
        values.push(filters.category_id);
    }

    // Thêm điều kiện lọc theo tác giả
    if (filters.author_id) {
        query += ` AND b.author_id = $${paramCount++}`;
        values.push(filters.author_id);
    }

    // Thêm điều kiện lọc theo trạng thái
    if (filters.status) {
        query += ` AND b.status = $${paramCount++}`;
        values.push(filters.status);
    }

    // Thêm sắp xếp
    query += ` ORDER BY b.created_at DESC`;

    // Thêm giới hạn và phân trang
    if (filters.limit) {
        query += ` LIMIT $${paramCount++}`;
        values.push(filters.limit);

        if (filters.offset) {
            query += ` OFFSET $${paramCount++}`;
            values.push(filters.offset);
        }
    }

    const result = await pool.query(query, values);
    return result.rows;
};

const searchBooks = async (keyword, limit = 10) => {
    const query = `
        SELECT b.book_id, b.title, b.url, b.image_url, b.excerpt, b.views, b.status, b.rating,
               a.author_id, a.name as author_name,
               c.category_id, c.name as category_name
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.author_id
        LEFT JOIN categories c ON b.category_id = c.category_id
        WHERE 
            b.title ILIKE $1 OR 
            b.excerpt ILIKE $1 OR 
            a.name ILIKE $1
        ORDER BY b.views DESC
        LIMIT $2
    `;
    const values = [`%${keyword}%`, limit];

    const result = await pool.query(query, values);
    return result.rows;
};

const getTrendingBooks = async (limit = 10) => {
    const query = `
        SELECT b.book_id, b.title, b.url, b.image_url, b.excerpt, b.views, b.status, b.rating,
               a.author_id, a.name as author_name,
               c.category_id, c.name as category_name
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.author_id
        LEFT JOIN categories c ON b.category_id = c.category_id
        ORDER BY b.views DESC
        LIMIT $1
    `;
    const values = [limit];

    const result = await pool.query(query, values);
    return result.rows;
};
const getBookById = async (bookId) => {
    // Truy vấn thông tin cơ bản về sách
    const bookQuery = `
        SELECT b.book_id, b.title, b.url, b.image_url, b.excerpt, b.views, b.status, b.rating,
               a.author_id, a.name as author_name, a.biography as author_biography,
               c.category_id, c.name as category_name, 
               b.created_at, b.updated_at
        FROM books b
        LEFT JOIN authors a ON b.author_id = a.author_id
        LEFT JOIN categories c ON b.category_id = c.category_id
        WHERE b.book_id = $1
    `;
    const bookResult = await pool.query(bookQuery, [bookId]);
    const book = bookResult.rows[0];

    if (!book) return null;

    // Truy vấn thông tin về số lượng chương
    const chapterStatsQuery = `
        SELECT 
            COUNT(*) as total_chapters,
            MAX(chapter_order) as latest_chapter_order,
            MAX(created_at) as last_update
        FROM chapters
        WHERE book_id = $1
    `;
    const chapterStatsResult = await pool.query(chapterStatsQuery, [bookId]);
    const chapterStats = chapterStatsResult.rows[0];

    // Truy vấn thông tin về chương đầu tiên
    const firstChapterQuery = `
        SELECT chapter_id, title, url
        FROM chapters
        WHERE book_id = $1
        ORDER BY chapter_order ASC
        LIMIT 1
    `;
    const firstChapterResult = await pool.query(firstChapterQuery, [bookId]);
    const firstChapter = firstChapterResult.rows[0] || null;

    // Truy vấn thông tin về chương mới nhất
    const latestChapterQuery = `
        SELECT chapter_id, title, url, created_at
        FROM chapters
        WHERE book_id = $1
        ORDER BY chapter_order DESC
        LIMIT 1
    `;
    const latestChapterResult = await pool.query(latestChapterQuery, [bookId]);
    const latestChapter = latestChapterResult.rows[0] || null;

    // Kết hợp tất cả thông tin
    return {
        ...book,
        total_chapters: parseInt(chapterStats.total_chapters) || 0,
        first_chapter: firstChapter,
        latest_chapter: latestChapter,
        last_update: chapterStats.last_update || book.updated_at
    };
};

const getChaptersByBookId = async (bookId) => {
    const query = `
        SELECT chapter_id, book_id, title, url, chapter_order, created_at, updated_at
        FROM chapters
        WHERE book_id = $1
        ORDER BY chapter_order ASC
    `;
    const values = [bookId];

    const result = await pool.query(query, values);
    return result.rows;
};

const getChapterById = async (chapterId) => {
    const query = `
        SELECT c.chapter_id, c.book_id, c.title, c.url, c.content, 
               c.next_chapter_url, c.prev_chapter_url, c.chapter_order,
               b.title as book_title, b.url as book_url
        FROM chapters c
        JOIN books b ON c.book_id = b.book_id
        WHERE c.chapter_id = $1
    `;
    const values = [chapterId];

    const result = await pool.query(query, values);
    return result.rows[0];
};

const increaseBookViews = async (bookId) => {
    const query = `
        UPDATE books
        SET views = views + 1
        WHERE book_id = $1
        RETURNING book_id, title, views
    `;
    const values = [bookId];

    const result = await pool.query(query, values);
    return result.rows[0];
};

const getBookDetail = async (bookId, chapterOrder = null) => {
    // Lấy thông tin cơ bản về sách
    const bookQuery = `
        SELECT b.book_id, b.title, b.url, b.image_url, b.excerpt, b.views, b.status, b.rating,
               a.author_id, a.name as author_name, a.biography as author_biography,
               c.category_id, c.name as category_name,
               b.created_at, b.updated_at
        FROM books b
                 LEFT JOIN authors a ON b.author_id = a.author_id
                 LEFT JOIN categories c ON b.category_id = c.category_id
        WHERE b.book_id = $1
    `;
    const bookResult = await pool.query(bookQuery, [bookId]);
    const book = bookResult.rows[0];

    if (!book) return null;

    // Truy vấn tổng số chương
    const totalChaptersQuery = `
        SELECT COUNT(*) as total_chapters
        FROM chapters
        WHERE book_id = $1
    `;

    // Truy vấn tổng số đánh giá
    const totalReviewsQuery = `
        SELECT COUNT(*) as total_reviews
        FROM book_reviews
        WHERE book_id = $1
    `;

    // Thực hiện cả hai truy vấn đồng thời
    const [totalChaptersResult, totalReviewsResult] = await Promise.all([
        pool.query(totalChaptersQuery, [bookId]),
        pool.query(totalReviewsQuery, [bookId])
    ]);

    const totalChapters = parseInt(totalChaptersResult.rows[0].total_chapters) || 0;
    const totalReviews = parseInt(totalReviewsResult.rows[0].total_reviews) || 0;

    // Lấy danh sách tất cả các chương (không bao gồm nội dung)
    const chaptersListQuery = `
        SELECT chapter_id, title, url, chapter_order
        FROM chapters
        WHERE book_id = $1
        ORDER BY chapter_order ASC
    `;
    const chaptersListResult = await pool.query(chaptersListQuery, [bookId]);
    const chaptersList = chaptersListResult.rows;

    let chapterContent = null;

    // Nếu có chỉ định số chương, lấy nội dung của chương đó
    if (chapterOrder !== null) {
        const chapterQuery = `
            SELECT chapter_id, title, url, content, chapter_order, next_chapter_url, prev_chapter_url
            FROM chapters
            WHERE book_id = $1 AND chapter_order = $2
        `;
        const chapterResult = await pool.query(chapterQuery, [bookId, chapterOrder]);

        if (chapterResult.rows.length > 0) {
            chapterContent = {
                chapter_id: chapterResult.rows[0].chapter_id,
                title: chapterResult.rows[0].title,
                chapter_order: chapterResult.rows[0].chapter_order,
                next_chapter_url: chapterResult.rows[0].next_chapter_url,
                prev_chapter_url: chapterResult.rows[0].prev_chapter_url,
                content: chapterResult.rows[0].content
            };
        }
    }

    // Trả về thông tin sách kết hợp với danh sách chương và nội dung chương được chỉ định
    return {
        ...book,
        total_chapters: totalChapters,
        total_reviews: totalReviews,
        chapters: chaptersList,
        current_chapter: chapterContent
    };
};
module.exports = {
    getBooks,
    searchBooks,
    getTrendingBooks,
    getBookById,
    getChaptersByBookId,
    getChapterById,
    increaseBookViews,
    getBookDetail
};