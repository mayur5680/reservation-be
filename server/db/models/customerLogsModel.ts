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

import { CustomerDbModel, OutletInvoiceDbModel, UserDbModel } from ".";

@Table({
  tableName: "CustomerLogs",
  freezeTableName: true,
})
export class CustomerLogsDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => CustomerDbModel)
  @Column
  declare customerId: number;

  @BelongsTo(() => CustomerDbModel)
  declare Customer?: CustomerDbModel;

  @AllowNull(false)
  @Column
  declare logType: string;

  @AllowNull(true)
  @Column
  declare purpose: string;

  @AllowNull(true)
  @Column
  declare moduleName: string;

  @AllowNull(true)
  @Column
  declare action: string;

  @AllowNull(true)
  @Column
  declare contentChange: string;

  @AllowNull(true)
  @ForeignKey(() => OutletInvoiceDbModel)
  @Column
  declare outletInvoiceId: string;

  @BelongsTo(() => OutletInvoiceDbModel)
  declare OutletInvoice?: OutletInvoiceDbModel;

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
