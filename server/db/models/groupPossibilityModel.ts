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
  HasMany,
  BelongsToMany,
} from "sequelize-typescript";

import {
  GroupTableDbModel,
  UserDbModel,
  OutletGroupTableDbModel,
  OutletTableDbModel,
} from ".";

@Table({
  tableName: "GroupPossibility",
  freezeTableName: true,
})
export class GroupPossibilityDbModel extends Model {
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

  @Default(true)
  @Column
  declare isActive: boolean;

  @Column
  declare index: number;

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

  @HasMany(() => OutletGroupTableDbModel)
  declare OutletGroupTable?: OutletGroupTableDbModel[];

  @BelongsToMany(() => OutletTableDbModel, {
    through: () => OutletGroupTableDbModel,
  })
  declare OutletTable?: OutletTableDbModel[];
}
