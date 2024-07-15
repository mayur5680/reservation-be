"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("IvrsDetails", "pressedDigit", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.changeColumn("IvrsDetails", "callstart", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.changeColumn("IvrsDetails", "sip", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("OutletInvoice", "pressedDigit");
  },
};
