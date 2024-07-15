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

import { OutletDbModel, UserDbModel } from ".";

@Table({
  tableName: "Coupon",
  freezeTableName: true,
})
export class CouponDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @Column
  declare startDate: Date;

  @AllowNull(false)
  @Column
  declare endDate: Date;

  @AllowNull(false)
  @Column
  declare openingTime: string;

  @AllowNull(false)
  @Column
  declare closingTime: string;

  @AllowNull(false)
  @Column
  declare discountAmount: number;

  @AllowNull(false)
  @Column
  declare noOfPerson: number;

  @AllowNull(true)
  @Column
  declare repeatOn: string;

  @AllowNull(true)
  @Column
  declare tc: string;

  @Default(true)
  @Column
  declare isCampaignActive: boolean;

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
