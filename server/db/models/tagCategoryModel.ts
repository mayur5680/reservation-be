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
  tableName: "TagCategory",
  freezeTableName: true,
})
export class TagCategoryDbModel extends Model {
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

  @AllowNull(true)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

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
