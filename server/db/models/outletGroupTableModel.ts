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

import { GroupPossibilityDbModel, OutletTableDbModel, UserDbModel } from ".";

@Table({
  tableName: "OutletGroupTable",
  freezeTableName: true,
})
export class OutletGroupTableDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => GroupPossibilityDbModel)
  @Column
  declare groupPossibilityId: number;

  @BelongsTo(() => GroupPossibilityDbModel)
  declare GroupPossibility?: GroupPossibilityDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletTableDbModel)
  @Column
  declare outletTableId: number;

  @BelongsTo(() => OutletTableDbModel)
  declare OutletTable?: OutletTableDbModel;

  @Column
  declare index: number;

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
