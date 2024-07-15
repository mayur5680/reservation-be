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
} from "sequelize-typescript";

import { UserDbModel, OutletDbModel, OutletInvoiceDbModel } from ".";

@Table({
  tableName: "SystemLog",
  freezeTableName: true,
})
export class SystemLogDbModel extends Model {
  @PrimaryKey
  @Column
  declare guid: string;

  @AllowNull(false)
  @Column
  declare type: string;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @Column
  declare action: string;

  @AllowNull(false)
  @Column
  declare module: string;

  @AllowNull(false)
  @Column
  declare identifier: string;

  @AllowNull(true)
  @Column
  declare status: string;

  @AllowNull(true)
  @Column
  declare duration: string;

  @AllowNull(true)
  @Column
  declare contentChange: string;

  @AllowNull(true)
  @Column
  declare requestData: string;

  @AllowNull(true)
  @Column
  declare responseData: string;

  @AllowNull(false)
  @Column({
    unique: "SystemLog_callerId_key",
  })
  declare callerId: string;

  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(true)
  @ForeignKey(() => OutletInvoiceDbModel)
  @Column
  declare outletInvoiceId: string;

  @BelongsTo(() => OutletInvoiceDbModel)
  declare OutletInvoice?: OutletInvoiceDbModel;

  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

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
}
