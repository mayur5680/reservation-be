"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Company", "mailChimpUserName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Company", "timezone", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "Asia/Singapore",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Company", "mailChimpUserName");
    await queryInterface.removeColumn("Company", "timezone");
  },
};
