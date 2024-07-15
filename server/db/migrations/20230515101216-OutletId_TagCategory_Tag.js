"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("TagCategory", "outletId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Outlet",
        key: "id",
      },
    });
    await queryInterface.addColumn("Tag", "outletId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Outlet",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("TagCategory", "outletId");
    await queryInterface.removeColumn("Tag", "outletId");
  },
};
