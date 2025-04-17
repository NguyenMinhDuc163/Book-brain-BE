const express = require('express');

require('dotenv').config();
const app = express();
const cors = require('cors');
const authRouter = require('./routes/auth.router'); // Route công khai
const categoryRouter = require('./routes/category.router');
const { logMiddleware } = require('./utils/logger');
const { authenticateJWT } = require('./middleware/authMiddleware'); // Middleware xác thực JWT
const bookRouter = require('./routes/book.router');

// Middleware để parse JSON và ghi log
app.use(express.json());
app.use(logMiddleware);

// Cấu hình CORS
app.use(cors({
    origin: 'https://reset.nguyenduc.click', // Miền được phép
    methods: 'GET,POST,PUT,DELETE', // Các phương thức được phép
    allowedHeaders: 'Content-Type,Authorization', // Các header được phép
}));

// Middleware xác thực JWT cho toàn bộ route, trừ route công khai
app.use((req, res, next) => {
    const publicRoutes = [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/api/v1/auth/forgot_password',
        '/api/v1/books',
        '/api/v1/detailBook',
        '/'
    ]; // Danh sách các route công khai

    if (publicRoutes.includes(req.path)) {
        return next(); // Bỏ qua xác thực nếu là route công khai
    }

    authenticateJWT(req, res, next); // Thực hiện xác thực JWT
});

// app.get('/favicon.ico', (req, res) => {
//     res.status(204).send(); // Trả về mã 204 nếu không có favicon
// });
// Route công khai
app.use(authRouter);

// Các route yêu cầu xác thực JWT
app.use(categoryRouter);
app.use(bookRouter);

app.use((req, res, next) => {
    res.status(404).json({
        code: 404,
        status: 'fail',
        message: 'API endpoint not found',
        error: ''
    });
});


module.exports = app;
