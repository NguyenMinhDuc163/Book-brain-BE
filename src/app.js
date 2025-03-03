const express = require('express');

require('dotenv').config();
const app = express();
const cors = require('cors');
const authRouter = require('./routes/auth.router'); // Route công khai
const { logMiddleware } = require('./utils/logger');
const { authenticateJWT } = require('./middleware/authMiddleware'); // Middleware xác thực JWT

// Middleware để parse JSON và ghi log
app.use(express.json());
app.use(logMiddleware);


// Middleware xác thực JWT cho toàn bộ route, trừ route công khai
app.use((req, res, next) => {
    const publicRoutes = [
        '/api/v1/auth/login',
        '/api/v1/auth/register',
        '/'
    ]; // Danh sách các route công khai

    if (publicRoutes.includes(req.path)) {
        return next(); // Bỏ qua xác thực nếu là route công khai
    }

    authenticateJWT(req, res, next); // Thực hiện xác thực JWT
});


app.use(authRouter);


app.use((req, res, next) => {
    res.status(404).json({
        code: 404,
        status: 'fail',
        message: 'API endpoint not found',
        error: ''
    });
});


module.exports = app;
