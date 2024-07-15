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

import { OutletDbModel, UserDbModel, SectionDbModel } from ".";

@Table({
  tableName: "OutletTimeSlotOverride",
  freezeTableName: true,
})
export class OutletTimeSlotOverrideDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @ForeignKey(() => SectionDbModel)
  @Column
  declare sectionId: number;

  @BelongsTo(() => SectionDbModel)
  declare Section?: SectionDbModel;

  @AllowNull(false)
  @Column
  declare dayofweek: number;

  @AllowNull(false)
  @Column
  declare effectiveFrom: Date;

  @AllowNull(false)
  @Column
  declare effectiveTo: Date;

  @AllowNull(true)
  @Column
  declare openingTime: string;

  @AllowNull(true)
  @Column
  declare closingTime: string;

  @AllowNull(false)
  @Column
  declare reason: string;

  @Default(true)
  @Column
  declare outletStatus: boolean;

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
