"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Company", "marketingId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Marketing",
        key: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tag", "marketingId");
  },
};
