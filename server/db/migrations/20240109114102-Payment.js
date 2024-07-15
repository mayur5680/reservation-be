"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Payment", {
      sessionId: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
      },
      customerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Customer",
          key: "id",
        },
      },
      outletId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Outlet",
          key: "id",
        },
      },
      request: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      client_secret: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      sessionResponse: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      outletInvoiceId: {
        type: Sequelize.STRING,
        allowNull: true,
        references: {
          model: "OutletInvoice",
          key: "id",
        },
      },
      is_Success: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      is_Event: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      ticketingId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Ticketing",
          key: "id",
        },
      },
      createdAt: {
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
        type: Sequelize.DATE,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Payment");
  },
};
