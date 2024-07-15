"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("GroupTable", "minPax", {
      type: Sequelize.INTEGER,
      allowNull: true,
      before: "description",
    });
    await queryInterface.addColumn("GroupTable", "maxPax", {
      type: Sequelize.INTEGER,
      allowNull: true,
      before: "description",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("GroupTable", "minPax");
    await queryInterface.removeColumn("GroupTable", "maxPax");
  },
};
