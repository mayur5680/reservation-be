"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  AutoIncrement,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  ForeignKey,
  BelongsTo,
  AllowNull,
  DeletedAt,
  BelongsToMany,
} from "sequelize-typescript";

import {
  OutletInvoiceDbModel,
  OutletDbModel,
  OutletTableDbModel,
  CustomerDbModel,
  UserDbModel,
} from ".";

@Table({
  tableName: "OutletTableBooking",
  freezeTableName: true,
})
export class OutletTableBookingDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => OutletInvoiceDbModel)
  @Column
  declare outletInvoiceId: string;

  @BelongsTo(() => OutletInvoiceDbModel, {
    targetKey: "id",
    foreignKey: "outletInvoiceId",
  })
  declare OutletInvoice?: OutletInvoiceDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletTableDbModel)
  @Column
  declare outletTableId: number;

  @BelongsTo(() => OutletTableDbModel)
  declare OutletTable?: OutletTableDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

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
  declare seatStartTime: Date;

  @AllowNull(true)
  @Column
  declare seatEndTime: Date;

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

  @BelongsToMany(() => CustomerDbModel, {
    through: () => OutletInvoiceDbModel,
    foreignKey: "id",
    sourceKey: "outletInvoiceId",
  })
  declare Customer?: CustomerDbModel[];
}
