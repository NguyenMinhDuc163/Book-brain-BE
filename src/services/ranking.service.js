// src/services/ranking.service.js
const pool = require('../configs/db.config');
const { logger } = require('../utils/logger');

// Lấy bảng xếp hạng sách
const getBookRankings = async (limit = 10) => {
    try {
        // Trước tiên thử lấy dữ liệu từ bảng xếp hạng
        let query = `
            SELECT br.book_id, b.title, b.url, b.image_url, b.views, b.rating,
                   a.author_id, a.name as author_name,
                   c.category_id, c.name as category_name,
                   br.ranking_score, br.overall_rank,
                   br.favorite_count, br.avg_rating, br.review_count
            FROM book_rankings br
                     JOIN books b ON br.book_id = b.book_id
                     LEFT JOIN authors a ON b.author_id = a.author_id
                     LEFT JOIN categories c ON b.category_id = c.category_id
            ORDER BY br.overall_rank NULLS LAST
                LIMIT $1
        `;

        let result = await pool.query(query, [limit]);

        // Nếu không có dữ liệu xếp hạng, lấy sách phổ biến nhất
        if (result.rows.length === 0) {
            query = `
                SELECT b.book_id, b.title, b.url, b.image_url, b.views, b.rating,
                       a.author_id, a.name as author_name,
                       c.category_id, c.name as category_name,
                       b.views as ranking_score, 0 as overall_rank,
                       (SELECT COUNT(*) FROM user_favorites uf WHERE uf.book_id = b.book_id) as favorite_count,
                       COALESCE((SELECT AVG(br.rating) FROM book_reviews br WHERE br.book_id = b.book_id), 0) as avg_rating,
                       (SELECT COUNT(*) FROM book_reviews br WHERE br.book_id = b.book_id) as review_count
                FROM books b
                LEFT JOIN authors a ON b.author_id = a.author_id
                LEFT JOIN categories c ON b.category_id = c.category_id
                ORDER BY b.views DESC, b.created_at DESC
                LIMIT $1
            `;
            result = await pool.query(query, [limit]);
        }

        return result.rows;
    } catch (error) {
        logger.error(`Lỗi khi lấy bảng xếp hạng sách: ${error.message}`);
        throw error;
    }
};

// Lấy danh sách tác giả xếp hạng cao
const getAuthorRankings = async (limit = 10) => {
    try {
        // Kiểm tra xem bảng xếp hạng có dữ liệu không
        const checkQuery = `SELECT COUNT(*) FROM author_rankings`;
        const checkResult = await pool.query(checkQuery);
        const hasRankingData = parseInt(checkResult.rows[0].count) > 0;

        let result;

        if (hasRankingData) {
            // Nếu có dữ liệu xếp hạng, lấy từ bảng author_rankings
            const rankingQuery = `
                SELECT 
                    ar.author_id, 
                    a.name, 
                    ar.total_books, 
                    ar.total_views, 
                    ar.avg_rating, 
                    ar.total_favorites, 
                    ar.author_score, 
                    ar.overall_rank
                FROM 
                    author_rankings ar
                JOIN 
                    authors a ON ar.author_id = a.author_id
                ORDER BY 
                    ar.overall_rank NULLS LAST
                LIMIT $1
            `;
            result = await pool.query(rankingQuery, [limit]);
        } else {
            // Nếu không có dữ liệu xếp hạng, lấy trực tiếp từ bảng authors
            const fallbackQuery = `
                SELECT 
                    a.author_id, 
                    a.name, 
                    0 as total_books,
                    0 as total_views,
                    0 as avg_rating,
                    0 as total_favorites,
                    0 as author_score,
                    0 as overall_rank
                FROM 
                    authors a
                ORDER BY 
                    a.author_id
                LIMIT $1
            `;
            result = await pool.query(fallbackQuery, [limit]);
        }

        // Bỏ qua phần top_books nếu gây lỗi

        return result.rows;
    } catch (error) {
        logger.error(`Lỗi khi lấy danh sách tác giả xếp hạng cao: ${error.message}`);
        throw error;
    }
};
// Cập nhật bảng xếp hạng
const updateRankings = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Cập nhật thông tin xếp hạng sách
        await client.query(`
            INSERT INTO book_rankings (
                book_id, views, avg_rating, review_count, favorite_count,
                ranking_score, category_id, last_calculated
            )
            SELECT
                b.book_id,
                b.views,
                COALESCE((SELECT AVG(br.rating) FROM book_reviews br WHERE br.book_id = b.book_id), 0) AS avg_rating,
                (SELECT COUNT(*) FROM book_reviews br WHERE br.book_id = b.book_id) AS review_count,
                (SELECT COUNT(*) FROM user_favorites uf WHERE uf.book_id = b.book_id) AS favorite_count,
                (
                    b.views +
                    (SELECT COUNT(*) FROM user_favorites uf WHERE uf.book_id = b.book_id) * 5 +
                    COALESCE((SELECT AVG(br.rating) FROM book_reviews br WHERE br.book_id = b.book_id), 0) * 10
                    ) AS ranking_score,
                b.category_id,
                CURRENT_TIMESTAMP
            FROM books b
                ON CONFLICT (book_id) 
            DO UPDATE SET
                views = EXCLUDED.views,
                                   avg_rating = EXCLUDED.avg_rating,
                                   review_count = EXCLUDED.review_count,
                                   favorite_count = EXCLUDED.favorite_count,
                                   ranking_score = EXCLUDED.ranking_score,
                                   category_id = EXCLUDED.category_id,
                                   last_calculated = EXCLUDED.last_calculated
        `);

        // Cập nhật xếp hạng tổng thể
        await client.query(`
            UPDATE book_rankings
            SET overall_rank = subquery.rank
                FROM (
                SELECT book_id, RANK() OVER (ORDER BY ranking_score DESC) AS rank
                FROM book_rankings
            ) AS subquery
            WHERE book_rankings.book_id = subquery.book_id
        `);

        // Cập nhật thông tin xếp hạng tác giả
        await client.query(`
            INSERT INTO author_rankings (
                author_id, total_books, total_views, avg_rating,
                total_favorites, author_score, last_calculated
            )
            SELECT
                a.author_id,
                COUNT(DISTINCT b.book_id) AS total_books,
                SUM(b.views) AS total_views,
                COALESCE(AVG(NULLIF(b.rating, '')::numeric), 0) AS avg_rating,
                (SELECT COUNT(*) FROM user_favorites uf JOIN books b2 ON uf.book_id = b2.book_id WHERE b2.author_id = a.author_id) AS total_favorites,
                (
                    COUNT(DISTINCT b.book_id) * 2 +
                    SUM(b.views) * 0.01 +
                    (SELECT COUNT(*) FROM user_favorites uf JOIN books b2 ON uf.book_id = b2.book_id WHERE b2.author_id = a.author_id) * 5 +
                    COALESCE(AVG(NULLIF(b.rating, '')::numeric), 0) * 8
                    ) AS author_score,
                CURRENT_TIMESTAMP
            FROM
                authors a
                    LEFT JOIN
                books b ON a.author_id = b.author_id
            GROUP BY
                a.author_id
                ON CONFLICT (author_id) 
            DO UPDATE SET
                total_books = EXCLUDED.total_books,
                                   total_views = EXCLUDED.total_views,
                                   avg_rating = EXCLUDED.avg_rating,
                                   total_favorites = EXCLUDED.total_favorites,
                                   author_score = EXCLUDED.author_score,
                                   last_calculated = EXCLUDED.last_calculated
        `);

        // Cập nhật xếp hạng tổng thể cho tác giả
        await client.query(`
            UPDATE author_rankings
            SET overall_rank = subquery.rank
                FROM (
                SELECT author_id, RANK() OVER (ORDER BY author_score DESC) AS rank
                FROM author_rankings
            ) AS subquery
            WHERE author_rankings.author_id = subquery.author_id
        `);

        await client.query('COMMIT');

        // Đếm số bản ghi đã cập nhật
        const [bookRankingsCount, authorRankingsCount] = await Promise.all([
            pool.query(`SELECT COUNT(*) FROM book_rankings`),
            pool.query(`SELECT COUNT(*) FROM author_rankings`)
        ]);

        return {
            updated_books: parseInt(bookRankingsCount.rows[0].count),
            updated_authors: parseInt(authorRankingsCount.rows[0].count),
            timestamp: new Date()
        };
    } catch (error) {
        await client.query('ROLLBACK');
        logger.error(`Lỗi khi cập nhật bảng xếp hạng: ${error.message}`);
        throw error;
    } finally {
        client.release();
    }
};

module.exports = {
    getBookRankings,
    getAuthorRankings,
    updateRankings
};