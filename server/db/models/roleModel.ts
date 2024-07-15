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
  HasMany,
  AllowNull,
  DeletedAt,
} from "sequelize-typescript";

import { OutletUserDbModel, OutletDbModel, UserDbModel } from "./";

@Table({
  tableName: "Role",
  freezeTableName: true,
})
export class RoleDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  declare name: string;

  @Column
  declare description: string;

  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
    as: "Users",
  })
  declare Users?: UserDbModel;

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

  @HasMany(() => OutletUserDbModel)
  declare OutletUser?: OutletUserDbModel[];

  @HasMany(() => UserDbModel)
  declare User?: UserDbModel[];
}
