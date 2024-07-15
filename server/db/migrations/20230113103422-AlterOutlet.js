"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Outlet", "companyId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Company",
        key: "id",
      },
    });
    await queryInterface.addColumn("Outlet", "allowOrder", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("Outlet", "allowBooking", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("Outlet", "image", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Outlet", "companyId");
    await queryInterface.removeColumn("Outlet", "allowOrder");
    await queryInterface.removeColumn("Outlet", "allowBooking");
    await queryInterface.removeColumn("Outlet", "image");
  },
};
