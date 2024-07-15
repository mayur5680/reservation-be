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

import { UserDbModel, RoleDbModel, OutletDbModel } from "./";

@Table({
  tableName: "OutletUser",
  freezeTableName: true,
})
export class OutletUserDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare userId: number;

  @BelongsTo(() => UserDbModel)
  declare User?: UserDbModel;

  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @ForeignKey(() => RoleDbModel)
  @Column
  declare roleId: number;

  @BelongsTo(() => RoleDbModel)
  declare Role?: RoleDbModel;

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
