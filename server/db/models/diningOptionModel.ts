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

import { SectionDbModel, OutletDbModel, UserDbModel } from ".";

@Table({
  tableName: "DiningOption",
  freezeTableName: true,
})
export class DiningOptionDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @Column
  declare description: string;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @Column
  declare price: number;

  @AllowNull(false)
  @Column
  declare dailyMaxQty: number;

  @AllowNull(false)
  @Column
  declare bookingMaxQty: number;

  @Column
  declare originalPrice: number;

  @Default(0)
  @Column
  declare leadTime: number;

  @AllowNull(true)
  @Column
  declare blockTime: string;

  @AllowNull(true)
  @Column
  declare repeatOn: string;

  @Default(false)
  @Column
  declare overridePrivateRoom: boolean;

  @AllowNull(false)
  @Column
  declare image: string;

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
