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

import { UserDbModel, CompanyDbModel } from ".";

@Table({
  tableName: "CompanyPermission",
  freezeTableName: true,
})
export class CompanyPermissionDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare userId: number;

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "userId",
    as: "Users",
  })
  declare Users?: UserDbModel;

  @AllowNull(true)
  @ForeignKey(() => CompanyDbModel)
  @Column
  declare companyId: number;

  @BelongsTo(() => CompanyDbModel)
  declare Company?: CompanyDbModel;

  @AllowNull(false)
  @Column
  declare permission: string;

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
