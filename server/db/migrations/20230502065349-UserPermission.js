"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "UserPermission",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        roleId: {
          type: Sequelize.INTEGER,
          references: {
            model: "Role",
            key: "id",
          },
        },
        outletId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "Outlet",
            key: "id",
          },
        },
        permission: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        isActive: {
          type: Sequelize.BOOLEAN,
          defaultValue: true,
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
            fields: ["roleId"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("UserPermission");
  },
};
