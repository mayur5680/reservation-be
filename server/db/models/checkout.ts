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
} from "sequelize-typescript";

import { UserDbModel, OutletInvoiceDbModel } from ".";

@Table({
  tableName: "Checkout",
  freezeTableName: true,
})
export class CheckoutDbModel extends Model {
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
  @Column
  declare transactionId: string;

  @AllowNull(true)
  @Column
  declare stripeResponse: string;

  @AllowNull(false)
  @Column
  declare status: string;

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

  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;
}
