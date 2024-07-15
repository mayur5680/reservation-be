"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("TableSection", "isPrivate", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("TableSection", "image", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("TableSection", "originalPrice", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("TableSection", "depositPrice", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn("TableSection", "blockTime", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("OutletTableSection", "isPrivate", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("TableSection", "isPrivate");
    await queryInterface.removeColumn("TableSection", "image");
    await queryInterface.removeColumn("TableSection", "originalPrice");
    await queryInterface.removeColumn("TableSection", "depositPrice");
    await queryInterface.removeColumn("TableSection", "blockTime");
    await queryInterface.removeColumn("OutletTableSection", "isPrivate");
  },
};
