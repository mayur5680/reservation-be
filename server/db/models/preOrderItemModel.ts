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
  tableName: "PreOrderItem",
  freezeTableName: true,
})
export class PreOrderItemDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @ForeignKey(() => SectionDbModel)
  @Column
  declare sectionId: number;

  @BelongsTo(() => SectionDbModel)
  declare Section?: SectionDbModel;

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
  declare maximumSpend: number;

  @Column
  declare creditCardHoldAmount: number;

  @Column
  declare originalPrice: number;

  @Default(0)
  @Column
  declare leadTime: number;

  @AllowNull(true)
  @Column
  declare image: string;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(true)
  @Column
  declare startDate: Date;

  @AllowNull(true)
  @Column
  declare endDate: Date;

  @AllowNull(true)
  @Column
  declare repeatOn: string;

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
