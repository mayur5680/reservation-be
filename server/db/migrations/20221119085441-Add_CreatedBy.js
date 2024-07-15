"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("User", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("Outlet", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("Role", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("OutletUser", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("SystemLog", "createdBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("User", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("Outlet", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("Role", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("OutletUser", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
      queryInterface.addColumn("SystemLog", "updatedBy", {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "User",
          key: "id",
        },
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn("User", "createdBy"),
      queryInterface.removeColumn("Outlet", "createdBy"),
      queryInterface.removeColumn("Role", "createdBy"),
      queryInterface.removeColumn("OutletUser", "createdBy"),
      queryInterface.removeColumn("SystemLog", "createdBy"),
      queryInterface.removeColumn("User", "updatedBy"),
      queryInterface.removeColumn("Outlet", "updatedBy"),
      queryInterface.removeColumn("Role", "updatedBy"),
      queryInterface.removeColumn("OutletUser", "updatedBy"),
      queryInterface.removeColumn("SystemLog", "updatedBy"),
    ]);
  },
};
