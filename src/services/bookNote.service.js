const db = require('../configs/db.config');

class BookNoteService {
    async createNote(userId, noteData) {
        try {
            const query = `
                INSERT INTO book_notes 
                (user_id, book_id, chapter_id, selected_text, note_content, start_position, end_position)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            
            const values = [
                userId,
                noteData.bookId,
                noteData.chapterId,
                noteData.selectedText,
                noteData.noteContent,
                noteData.startPosition,
                noteData.endPosition
            ];

            const result = await db.query(query, values);
            const note = result.rows[0];

            return {
                bookId: note.book_id,
                chapterId: note.chapter_id,
                selectedText: note.selected_text,
                noteContent: note.note_content,
                startPosition: note.start_position,
                endPosition: note.end_position
            };
        } catch (error) {
            throw new Error('Không thể tạo ghi chú: ' + error.message);
        }
    }

    async getNotes(userId, bookId = null, chapterId = null) {
        try {
            let query = `
                SELECT 
                    book_id,
                    chapter_id,
                    selected_text,
                    note_content,
                    start_position,
                    end_position
                FROM book_notes
                WHERE user_id = $1
            `;
            
            const values = [userId];
            let paramIndex = 2;

            if (bookId) {
                query += ` AND book_id = $${paramIndex}`;
                values.push(bookId);
                paramIndex++;
            }
            
            if (chapterId) {
                query += ` AND chapter_id = $${paramIndex}`;
                values.push(chapterId);
            }

            query += ` ORDER BY created_at DESC`;

            const result = await db.query(query, values);

            return result.rows.map(note => ({
                bookId: note.book_id,
                chapterId: note.chapter_id,
                selectedText: note.selected_text,
                noteContent: note.note_content,
                startPosition: note.start_position,
                endPosition: note.end_position
            }));
        } catch (error) {
            throw new Error('Không thể lấy danh sách ghi chú: ' + error.message);
        }
    }
}

module.exports = new BookNoteService(); 