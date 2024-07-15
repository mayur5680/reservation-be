"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      "IvrsVoiceCall",
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        fromPhoneNo: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        path: {
          type: Sequelize.TEXT,
          allowNull: false,
        },
        time: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        isLink: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        IvrsDetailId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: "IvrsDetails",
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
            fields: ["path"],
          },
        },
      }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("IvrsVoiceCall");
  },
};
