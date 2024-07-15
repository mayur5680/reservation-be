"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Customer", "customerCompanyName", {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn("Customer", "isPrivateTableBooked", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("OutletInvoice", "isPrivateTableBooked", {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    });
    await queryInterface.addColumn("OutletInvoice", "originalTotalAmount", {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    });
    await queryInterface.addColumn(
      "OutletInvoice",
      "totalAmountBeforeDiscount",
      {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0,
      }
    );
    await queryInterface.addColumn("OutletInvoice", "totalPaidAmount", {
      type: Sequelize.DOUBLE,
      allowNull: true,
      defaultValue: 0,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Customer", "customerCompanyName");
    await queryInterface.removeColumn("Customer", "isPrivateTable");
    await queryInterface.removeColumn("OutletInvoice", "isPrivateTableBooked");
    await queryInterface.removeColumn("OutletInvoice", "originalTotalAmount");
    await queryInterface.removeColumn(
      "OutletInvoice",
      "totalAmountBeforeDiscount"
    );
    await queryInterface.removeColumn("OutletInvoice", "totalPaidAmount");
  },
};
