module.exports = (sequelize, DataTypes) => {
  const ServerLog = sequelize.define('ServerLog', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    level: {
      type: DataTypes.STRING,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status_code: {
      type: DataTypes.INTEGER
    },
    method: {
      type: DataTypes.STRING,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
    },
    headers: {
      type: DataTypes.JSON
    },
    request_body: {
      type: DataTypes.JSON
    },
    response_body: {
      type: DataTypes.JSON
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: false
  });

  return ServerLog;
};
