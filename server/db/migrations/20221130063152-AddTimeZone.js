"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Outlet", "timezone", {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: "Asia/Singapore",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Outlet", "timezone");
  },
};
