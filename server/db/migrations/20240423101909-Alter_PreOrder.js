"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("PreOrderItem", "startDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("PreOrderItem", "endDate", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("PreOrderItem", "repeatOn", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("PreOrderItem", "startDate");
    await queryInterface.removeColumn("PreOrderItem", "endDate");
    await queryInterface.removeColumn("PreOrderItem", "repeatOn");
  },
};
