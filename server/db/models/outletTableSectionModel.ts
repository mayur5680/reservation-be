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

import {
  TableSectionDbModel,
  OutletTableDbModel,
  UserDbModel,
  OutletDbModel,
} from ".";

@Table({
  tableName: "OutletTableSection",
  freezeTableName: true,
})
export class OutletTableSectionDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => TableSectionDbModel)
  @Column
  declare tableSectionId: number;

  @BelongsTo(() => TableSectionDbModel)
  declare TableSection?: TableSectionDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletTableDbModel)
  @Column
  declare outletTableId: number;

  @BelongsTo(() => OutletTableDbModel)
  declare OutletTable?: OutletTableDbModel;

  @Default(false)
  @Column
  declare isPrivate: boolean;

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
