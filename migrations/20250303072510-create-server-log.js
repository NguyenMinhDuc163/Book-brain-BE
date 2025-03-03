'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ServerLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      level: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.TEXT
      },
      status_code: {
        type: Sequelize.INTEGER
      },
      method: {
        type: Sequelize.STRING
      },
      url: {
        type: Sequelize.STRING
      },
      headers: {
        type: Sequelize.JSON
      },
      request_body: {
        type: Sequelize.JSON
      },
      response_body: {
        type: Sequelize.JSON
      },
      timestamp: {
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ServerLogs');
  }
};