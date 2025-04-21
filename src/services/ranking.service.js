// src/services/ranking.service.js
const pool = require('../configs/db.config');
const { logger } = require('../utils/logger');

// Lấy bảng xếp hạng sách theo loại
const getBookRankings = async (type = 'popular', limit = 10) => {
    try {
        // Xác thực loại xếp hạng hợp lệ
        const validTypes = ['popular', 'trending', 'top_rated'];
        if (!validTypes.includes(type)) {
            throw new Error('Loại xếp hạng không hợp lệ');
        }

        const query = `
            SELECT br.ranking_id, br.book_id, br.ranking_type, br.rank_position, br.score,
                   b.title, b.url, b.image_url, b.excerpt, b.views, b.status, b.rating,
                   a.author_id, a.name as author_name,
                   c.category_id, c.name as category_name
            FROM book_rankings br
            JOIN books b ON br.book_id = b.book_id
            LEFT JOIN authors a ON b.author_id = a.author_id
            LEFT JOIN categories c ON b.category_id = c.category_id
            WHERE br.ranking_type = $1
            ORDER BY br.rank_position
            LIMIT $2
        `;

        const result = await pool.query(query, [type, limit]);
        return result.rows;
    } catch (error) {
        logger.error(`Lỗi khi lấy bảng xếp hạng sách: ${error.message}`);
        throw error;
    }
};

// Lấy danh sách tác giả được đề xuất
const getAuthorRecommendations = async (limit = 10) => {
    try {
        const query = `
            SELECT ar.recommendation_id, ar.author_id, ar.rank_position, ar.score,
                   a.name, a.biography,
                   (SELECT COUNT(*) FROM books WHERE author_id = ar.author_id) as book_count,
                   (SELECT ARRAY_AGG(
                        jsonb_build_object(
                            'book_id', b.book_id, 
                            'title', b.title, 
                            'image_url', b.image_url,
                            'rating', b.rating
                        )
                    ) FROM books b WHERE b.author_id = ar.author_id ORDER BY b.views DESC LIMIT 3) as top_books
            FROM author_recommendations ar
            JOIN authors a ON ar.author_id = a.author_id
            ORDER BY ar.rank_position
            LIMIT $1
        `;

        const result = await pool.query(query, [limit]);
        return result.rows;
    } catch (error) {
        logger.error(`Lỗi khi lấy danh sách tác giả được đề xuất: ${error.message}`);
        throw error;
    }
};

// Cập nhật bảng xếp hạng
const updateRankings = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Cập nhật bảng xếp hạng POPULAR (phổ biến)
        await client.query(`DELETE FROM book_rankings WHERE ranking_type = 'popular'`);

        await client.query(`
            INSERT INTO book_rankings (book_id, ranking_type, rank_position, score)
            SELECT 
                b.book_id,
                'popular',
                ROW_NUMBER() OVER (ORDER BY (
                    b.views + 
                    COALESCE((SELECT COUNT(*) FROM user_favorites uf WHERE uf.book_id = b.book_id), 0) * 5 +
                    COALESCE((SELECT AVG(br.rating::numeric) FROM book_reviews br WHERE br.book_id = b.book_id), 0) * 10
                ) DESC) as rank_position,
                (
                    b.views + 
                    COALESCE((SELECT COUNT(*) FROM user_favorites uf WHERE uf.book_id = b.book_id), 0) * 5 +
                    COALESCE((SELECT AVG(br.rating::numeric) FROM book_reviews br WHERE br.book_id = b.book_id), 0) * 10
                ) as score
            FROM books b
            ORDER BY score DESC
            LIMIT 100
        `);

        // Cập nhật bảng xếp hạng TRENDING (xu hướng)
        await client.query(`DELETE FROM book_rankings WHERE ranking_type = 'trending'`);

        await client.query(`
            INSERT INTO book_rankings (book_id, ranking_type, rank_position, score)
            SELECT 
                b.book_id,
                'trending',
                ROW_NUMBER() OVER (ORDER BY (
                    COALESCE((SELECT COUNT(*) FROM user_reading_progress urp 
                            WHERE urp.book_id = b.book_id AND urp.last_read_at > (CURRENT_TIMESTAMP - INTERVAL '14 days')), 0) * 10 +
                    COALESCE((SELECT COUNT(*) FROM user_favorites uf 
                            WHERE uf.book_id = b.book_id AND uf.added_at > (CURRENT_TIMESTAMP - INTERVAL '14 days')), 0) * 5 +
                    COALESCE((SELECT COUNT(*) FROM book_reviews br 
                            WHERE br.book_id = b.book_id AND br.created_at > (CURRENT_TIMESTAMP - INTERVAL '14 days')), 0) * 3
                ) DESC) as rank_position,
                (
                    COALESCE((SELECT COUNT(*) FROM user_reading_progress urp 
                            WHERE urp.book_id = b.book_id AND urp.last_read_at > (CURRENT_TIMESTAMP - INTERVAL '14 days')), 0) * 10 +
                    COALESCE((SELECT COUNT(*) FROM user_favorites uf 
                            WHERE uf.book_id = b.book_id AND uf.added_at > (CURRENT_TIMESTAMP - INTERVAL '14 days')), 0) * 5 +
                    COALESCE((SELECT COUNT(*) FROM book_reviews br 
                            WHERE br.book_id = b.book_id AND br.created_at > (CURRENT_TIMESTAMP - INTERVAL '14 days')), 0) * 3
                ) as score
            FROM books b
            ORDER BY score DESC
            LIMIT 50
        `);

        // Cập nhật bảng xếp hạng TOP_RATED (đánh giá cao)
        await client.query(`DELETE FROM book_rankings WHERE ranking_type = 'top_rated'`);

        await client.query(`
            INSERT INTO book_rankings (book_id, ranking_type, rank_position, score)
            SELECT 
                b.book_id,
                'top_rated',
                ROW_NUMBER() OVER (ORDER BY COALESCE((SELECT AVG(br.rating::numeric) FROM book_reviews br WHERE br.book_id = b.book_id), 0) DESC) as rank_position,
                COALESCE((SELECT AVG(br.rating::numeric) FROM book_reviews br WHERE br.book_id = b.book_id), 0) as score
            FROM books b
            WHERE (SELECT COUNT(*) FROM book_reviews br WHERE br.book_id = b.book_id) > 3
            ORDER BY score DESC
            LIMIT 50
        `);

        // Cập nhật đề xuất tác giả
        await client.query(`DELETE FROM author_recommendations`);

        await client.query(`
            INSERT INTO author_recommendations (author_id, rank_position, score)
            SELECT 
                a.author_id,
                ROW_NUMBER() OVER (ORDER BY (
                    COALESCE((SELECT COUNT(*) FROM books b WHERE b.author_id = a.author_id), 0) * 2 +
                    COALESCE((SELECT SUM(b.views) FROM books b WHERE b.author_id = a.author_id), 0) * 0.01 +
                    COALESCE((SELECT COUNT(*) FROM user_favorites uf JOIN books b ON uf.book_id = b.book_id 
                            WHERE b.author_id = a.author_id), 0) * 5 +
                    COALESCE((SELECT AVG(br.rating::numeric) FROM book_reviews br JOIN books b ON br.book_id = b.book_id 
                            WHERE b.author_id = a.author_id), 0) * 10
                ) DESC) as rank_position,
                (
                    COALESCE((SELECT COUNT(*) FROM books b WHERE b.author_id = a.author_id), 0) * 2 +
                    COALESCE((SELECT SUM(b.views) FROM books b WHERE b.author_id = a.author_id), 0) * 0.01 +
                    COALESCE((SELECT COUNT(*) FROM user_favorites uf JOIN books b ON uf.book_id = b.book_id 
                            WHERE b.author_id = a.author_id), 0) * 5 +
                    COALESCE((SELECT AVG(br.rating::numeric) FROM book_reviews br JOIN books b ON br.book_id = b.book_id 
                            WHERE b.author_id = a.author_id), 0) * 10
                ) as score
            FROM authors a
            ORDER BY score DESC
            LIMIT 30
        `);

        await client.query('COMMIT');

        // Đếm số bản ghi đã cập nhật
        const [popularCount, trendingCount, topRatedCount, authorsCount] = await Promise.all([
            pool.query(`SELECT COUNT(*) FROM book_rankings WHERE ranking_type = 'popular'`),
            pool.query(`SELECT COUNT(*) FROM book_rankings WHERE ranking_type = 'trending'`),
            pool.query(`SELECT COUNT(*) FROM book_rankings WHERE ranking_type = 'top_rated'`),
            pool.query(`SELECT COUNT(*) FROM author_recommendations`)
        ]);

        return {
            updated_popular: parseInt(popularCount.rows[0].count),
            updated_trending: parseInt(trendingCount.rows[0].count),
            updated_top_rated: parseInt(topRatedCount.rows[0].count),
            updated_authors: parseInt(authorsCount.rows[0].count)
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
    getAuthorRecommendations,
    updateRankings
};