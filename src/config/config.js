require('dotenv').config();

const env = process.env.NODE_ENV || 'development'; // Mặc định là 'development' nếu NODE_ENV không được đặt

const config = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT, // Thêm cổng database
        dialect: process.env.DB_DIALECT
    },
    test: {
        username: process.env.DB_USER_TEST || "root",
        password: process.env.DB_PASSWORD_TEST || null,
        database: process.env.DB_NAME_TEST || "database_test",
        host: process.env.DB_HOST_TEST || "127.0.0.1",
        port: process.env.DB_PORT_TEST || 3306, // Cổng mặc định của MySQL
        dialect: process.env.DB_DIALECT_TEST || "mysql"
    },
    production: {
        username: process.env.DB_USER_PROD || "root",
        password: process.env.DB_PASSWORD_PROD || null,
        database: process.env.DB_NAME_PROD || "database_production",
        host: process.env.DB_HOST_PROD || "127.0.0.1",
        port: process.env.DB_PORT_PROD || 3306, // Cổng mặc định của MySQL
        dialect: process.env.DB_DIALECT_PROD || "mysql"
    }
};

module.exports = config;
