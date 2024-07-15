"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DeletedAt,
  HasMany,
  DataType,
  HasOne,
} from "sequelize-typescript";

import {
  CheckoutDbModel,
  CouponDbModel,
  CustomerDbModel,
  DiningOptionDbModel,
  OutletDbModel,
  OutletTableBookingDbModel,
  TicketingDbModel,
  UserDbModel,
} from ".";

@Table({
  tableName: "OutletInvoice",
  freezeTableName: true,
})
export class OutletInvoiceDbModel extends Model {
  @PrimaryKey
  @Column
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => CustomerDbModel)
  @Column
  declare customerId: number;

  @BelongsTo(() => CustomerDbModel)
  declare Customer?: CustomerDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(true)
  @Column
  declare bookingType: string;

  @AllowNull(true)
  @Column
  declare mealType: string;

  @AllowNull(true)
  @Column
  declare source: string;

  @AllowNull(false)
  @Column
  declare noOfPerson: number;

  @AllowNull(true)
  @Column
  declare noOfAdult: number;

  @AllowNull(true)
  @Column
  declare noOfChild: number;

  @AllowNull(false)
  @Column
  declare bookingDate: Date;

  @AllowNull(false)
  @Column
  declare bookingStartTime: Date;

  @AllowNull(false)
  @Column
  declare bookingEndTime: Date;

  @AllowNull(true)
  @Column
  declare status: string;

  @AllowNull(true)
  @Column
  declare occasion: string;

  @AllowNull(true)
  @Column
  declare seatingPreference: string;

  @AllowNull(true)
  @Column
  declare specialRequest: string;

  @AllowNull(true)
  @Column
  declare reservationNotes: string;

  @AllowNull(true)
  @Column
  declare promocode: string;

  @AllowNull(true)
  @Column
  declare dietaryRestriction: string;

  @AllowNull(true)
  @Column
  declare customerCompanyName: string;

  @AllowNull(true)
  @Column
  declare privateRoom: string;

  @AllowNull(true)
  @Column
  declare dinningOptions: string;

  @AllowNull(true)
  @Column
  declare basket: string;

  @AllowNull(true)
  @Column
  declare image: string;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare discountAmount: number;

  @AllowNull(true)
  @ForeignKey(() => CouponDbModel)
  @Column
  declare couponId: number;

  @BelongsTo(() => CouponDbModel)
  declare Coupon?: CouponDbModel;

  @AllowNull(true)
  @ForeignKey(() => DiningOptionDbModel)
  @Column
  declare diningOptionId: number;

  @BelongsTo(() => DiningOptionDbModel)
  declare DiningOption?: DiningOptionDbModel;

  @AllowNull(true)
  @Column
  declare diningOptionQty: number;

  @AllowNull(true)
  @ForeignKey(() => TicketingDbModel)
  @Column
  declare ticketingId: number;

  @BelongsTo(() => TicketingDbModel)
  declare Ticketing?: TicketingDbModel;

  @Default(false)
  @Column
  declare isPrivateTableBooked: boolean;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare amountIncludingGST: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare amountExcludingGST: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare GST: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare totalAmount: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare originalTotalAmount: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare totalAmountBeforeDiscount: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare totalPaidAmount: number;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare remainingAmount: number;

  @AllowNull(true)
  @Column({
    unique: "unique_bookingId",
  })
  @Column
  declare chopeBookingId: string;

  @AllowNull(true)
  @Column
  declare stripeSetupIntentId: string;

  @AllowNull(true)
  @Column
  declare stripePaymentMethodId: string;

  @Default(false)
  @Column
  declare isValidSetupIntent: Boolean;

  @AllowNull(true)
  @Column
  declare paymentType: string;

  @Default(true)
  @Column
  declare isActive: boolean;

  @CreatedAt
  @Column
  declare createdAt: Date;

  @AllowNull(true)
  @UpdatedAt
  @Column
  declare updatedAt: Date;

  @AllowNull(true)
  @DeletedAt
  @Column
  declare deletedAt: Date;

  @AllowNull(true)
  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @AllowNull(true)
  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;

  @HasMany(() => OutletTableBookingDbModel)
  declare OutletTableBooking?: OutletTableBookingDbModel[];

  @HasOne(() => CheckoutDbModel)
  declare Checkout?: CheckoutDbModel;
}
