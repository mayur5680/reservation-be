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

import { GroupTableDbModel, OutletTableDbModel, UserDbModel } from ".";

@Table({
  tableName: "GroupSequence",
  freezeTableName: true,
})
export class GroupSequenceTableDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => GroupTableDbModel)
  @Column
  declare groupTableId: number;

  @BelongsTo(() => GroupTableDbModel)
  declare GroupTable?: GroupTableDbModel;
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
