"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Category", "outletId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Outlet",
        key: "id",
      },
    });
    await queryInterface.addColumn("SubCategory", "outletId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Outlet",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Category", "outletId");
    await queryInterface.removeColumn("SubCategory", "outletId");
  },
};
