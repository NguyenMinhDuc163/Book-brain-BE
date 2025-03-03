require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/config.js'); // Đọc từ config.js thay vì config.json

const env = process.env.NODE_ENV || 'development'; // Xác định môi trường
const dbConfig = config[env]; // Lấy cấu hình tương ứng

const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
  host: dbConfig.host,
  dialect: dbConfig.dialect,
  logging: false
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Khởi tạo models
db.User = require('./user')(sequelize, DataTypes);
db.ServerLog = require('./serverLog')(sequelize, DataTypes);

// Đồng bộ database
db.sequelize.sync()
    .then(() => {
      console.log(`✅ Database synced successfully!`);
      console.log(`🌍 Environment: ${env}`);
      console.log(`🗄️ Connected to Database: ${dbConfig.dialect}`);
      console.log(`🗄️ Connected to Database: ${dbConfig.database}`);
    })
    .catch(err => console.error('❌ Sync error:', err));

module.exports = db;
