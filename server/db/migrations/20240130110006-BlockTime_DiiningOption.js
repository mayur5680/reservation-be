"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("DiningOption", "blockTime", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("DiningOption", "repeatOn", {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn("DiningOption", "overridePrivateRoom", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("DiningOption", "blockTime");
    await queryInterface.removeColumn("DiningOption", "repeatOn");
    await queryInterface.removeColumn("DiningOption", "overridePrivateRoom");
  },
};
