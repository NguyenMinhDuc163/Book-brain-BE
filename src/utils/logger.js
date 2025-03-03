const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;
const { ServerLog } = require('../models');

// Hàm lọc ra những headers quan trọng
const filterHeaders = (headers) => {
    const allowedHeaders = ['authorization', 'content-type'];
    let filteredHeaders = {};
    allowedHeaders.forEach(header => {
        if (headers[header]) {
            filteredHeaders[header] = headers[header];
        }
    });
    return filteredHeaders;
};

// Hàm lưu log vào database bằng Sequelize
const saveLogToDB = async (level, message, req, res) => {
    try {
        await ServerLog.create({
            level,
            message,
            status_code: res.statusCode,
            method: req.method,
            url: req.originalUrl,
            headers: filterHeaders(req.headers),
            request_body: req.body,
            response_body: res.body ? JSON.parse(res.body) : null,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('Lỗi khi lưu log vào database:', err);
    }
};

// Định dạng log console
const logFormat = printf(({ level, message, timestamp, meta }) => {
    return [
        `\n${timestamp} [${level}]`,
        `Method: ${meta?.request?.method || 'N/A'}`,
        `URL: ${meta?.request?.url || 'N/A'}`,
        `Headers: ${JSON.stringify(filterHeaders(meta?.request?.headers || {}))}`,
        `Request Body: ${JSON.stringify(meta?.request?.body || {})}`,
        `Response Status: ${meta?.response?.statusCode || 'N/A'}`,
        `Response Body: ${JSON.stringify(meta?.response?.body || {})}`
    ].join('\n');
});

// Tạo logger
const logger = createLogger({
    level: 'info',
    format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new transports.Console(),
    ],
});

// Middleware để ghi log vào database
const logMiddleware = (req, res, next) => {
    const oldSend = res.send;

    res.send = function (data) {
        res.body = data;  // Gán response body
        return oldSend.apply(res, arguments);
    };

    res.on('finish', async () => {
        const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
        const meta = {
            request: {
                method: req.method,
                url: req.originalUrl,
                headers: req.headers,
                body: req.body,
            },
            response: {
                statusCode: res.statusCode,
                statusMessage: res.statusMessage,
                body: null
            },
        };

        try {
            if (res.body) {
                meta.response.body = JSON.parse(res.body);
            }
        } catch (err) {
            console.warn('Không thể parse response body:', err.message);
        }

        logger.info(message, { meta }); // Log ra console
        await saveLogToDB('info', message, req, res); // Lưu vào database
    });

    next();
};

module.exports = {
    logger,
    logMiddleware,
};
