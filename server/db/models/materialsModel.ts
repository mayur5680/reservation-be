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
  UserDbModel,
  OutletDbModel,
  CategoryDbModel,
  SubCategoryDbModel,
} from ".";

@Table({
  tableName: "Materials",
  freezeTableName: true,
})
export class MaterialsDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @Column
  declare title: string;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(false)
  @Column
  declare type: string;

  @AllowNull(false)
  @Column
  declare attachment: string;

  @AllowNull(true)
  @Column
  declare thumbnail: string;

  @AllowNull(true)
  @Column
  declare tags: string;

  @AllowNull(false)
  @ForeignKey(() => CategoryDbModel)
  @Column
  declare categoryId: number;

  @BelongsTo(() => CategoryDbModel)
  declare Category?: CategoryDbModel;

  @AllowNull(false)
  @ForeignKey(() => SubCategoryDbModel)
  @Column
  declare subCategoryId: number;

  @BelongsTo(() => SubCategoryDbModel)
  declare SubCategory?: SubCategoryDbModel;

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
