"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("OutletInvoice", {
      id: {
        type: Sequelize.STRING,
        guid: true,
        primaryKey: true,
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
        allowNull: true,
        references: {
          model: "Outlet",
          key: "id",
        },
      },
      noOfPerson: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      bookingDate: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      bookingStartTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      bookingEndTime: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      bookingType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      mealType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      source: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      occasion: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      seatingPreference: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      specialRequest: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      reservationNotes: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true,
        defaultValue: "BOOKED",
      },
      promocode: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dietaryRestriction: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      discountAmount: {
        type: Sequelize.DOUBLE,
        defaultValue: 0,
      },
      couponId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Coupon",
          key: "id",
        },
      },
      diningOptionId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "DiningOption",
          key: "id",
        },
      },
      diningOptionQty: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      ticketingId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Ticketing",
          key: "id",
        },
      },
      amountIncludingGST: {
        type: Sequelize.DOUBLE,
      },
      amountExcludingGST: {
        type: Sequelize.DOUBLE,
      },
      GST: {
        type: Sequelize.DOUBLE,
      },
      totalAmount: {
        type: Sequelize.DOUBLE,
      },
      paymentType: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
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
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("OutletInvoice");
  },
};
