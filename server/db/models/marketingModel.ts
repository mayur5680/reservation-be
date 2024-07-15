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

import { CompanyDbModel, UserDbModel } from ".";

@Table({
  tableName: "Marketing",
  freezeTableName: true,
})
export class MarketingDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(true)
  @Column
  declare tags: string;

  @AllowNull(true)
  @Column
  declare criteria: string;

  @AllowNull(true)
  @Column
  declare mailchimpListId: string;

  @AllowNull(true)
  @Column
  declare mergerField: string;

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
