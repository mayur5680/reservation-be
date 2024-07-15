"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("SystemLog", "requestData", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("SystemLog", "responseData", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("SystemLog", "requestData");
    await queryInterface.removeColumn("SystemLog", "responseData");
  },
};
