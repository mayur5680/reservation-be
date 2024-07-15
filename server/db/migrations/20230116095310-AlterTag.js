"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Tag", "tagCategoryId", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "TagCategory",
        key: "id",
      },
    });
    await queryInterface.removeColumn("Tag", "outletId");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Tag", "tagCategoryId");
  },
};
