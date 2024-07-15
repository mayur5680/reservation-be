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
  AllowNull,
  DeletedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

import { OutletDbModel, TagDbModel, UserDbModel } from ".";

@Table({
  tableName: "AutoTagging",
  freezeTableName: true,
})
export class AutoTaggingDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(true)
  @Column
  declare criteria: string;

  @AllowNull(false)
  @ForeignKey(() => TagDbModel)
  @Column
  declare tagId: number;

  @BelongsTo(() => TagDbModel)
  declare Tag?: TagDbModel;

  @AllowNull(false)
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

  @AllowNull(true)
  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @AllowNull(true)
  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;
}
