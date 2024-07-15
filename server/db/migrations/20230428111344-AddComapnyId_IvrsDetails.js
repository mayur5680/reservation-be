"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("IvrsDetails", "companyId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Company",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("IvrsDetails", "companyId");
  },
};