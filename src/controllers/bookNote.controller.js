const bookNoteService = require('../services/bookNote.service');

class BookNoteController {
    async createNote(req, res) {
        try {
            const userId = req.user.userId;
            const noteData = req.body;

            const note = await bookNoteService.createNote(userId, noteData);

            res.status(201).json({
                code: 201,
                data: [note],
                status: 'success',
                message: 'Tạo ghi chú thành công',
                error: ''
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                data: [],
                status: 'error',
                message: error.message,
                error: error.message
            });
        }
    }

    async getNotes(req, res) {
        try {
            const userId = req.user.userId;
            const { bookId, chapterId } = req.query;

            const notes = await bookNoteService.getNotes(userId, bookId, chapterId);

            res.status(200).json({
                code: 200,
                data: notes,
                status: 'success',
                message: '',
                error: ''
            });
        } catch (error) {
            res.status(500).json({
                code: 500,
                data: [],
                status: 'error',
                message: error.message,
                error: error.message
            });
        }
    }
}

module.exports = new BookNoteController(); 