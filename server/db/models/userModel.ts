"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  AutoIncrement,
  Table,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  Default,
  HasMany,
  ForeignKey,
  BelongsTo,
  DeletedAt,
} from "sequelize-typescript";

import { OutletUserDbModel, RoleDbModel } from "./";

@Table({
  tableName: "User",
  freezeTableName: true,
})
export class UserDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  declare userName: string;

  @Column
  declare firstName: string;

  @AllowNull(true)
  @Column
  declare lastName: string;

  @Column
  declare email: string;

  @Column
  declare phone: string;

  @Column
  declare password: string;

  @AllowNull(true)
  @Column
  declare gender: string;

  @AllowNull(true)
  @Column
  declare dob: Date;

  @Column
  declare loggedAt: Date;

  @AllowNull(true)
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

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;

  @Default(true)
  @Column
  declare isActive: boolean;

  @Default(true)
  @Column
  declare isPartially: boolean;

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
}
