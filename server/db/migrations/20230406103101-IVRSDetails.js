"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "IvrsDetails",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        callerId: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        sip: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        callstart: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        callend: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        from: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        to: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        duration: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        status: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        is_recorded: {
          type: Sequelize.BOOLEAN,
          allowNull: true,
        },
        pbx_call_id: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        notes: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        tags: {
          type: Sequelize.STRING,
          allowNull: true,
        },
        isDone: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        outletId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Outlet",
            key: "id",
          },
        },
        customerId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Customer",
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
      },
      {
        uniqueKeys: {
          Items_unique: {
            unique: true,
            fields: ["callerId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("IvrsDetails");
  },
};
