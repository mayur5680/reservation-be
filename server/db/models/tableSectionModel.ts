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
  OutletSeatingTypeDbModel,
  OutletDbModel,
  UserDbModel,
  OutletTableSectionDbModel,
  OutletTableDbModel,
} from ".";

@Table({
  tableName: "TableSection",
  freezeTableName: true,
})
export class TableSectionDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @Column
  declare color: string;

  @AllowNull(false)
  @ForeignKey(() => OutletSeatingTypeDbModel)
  @Column
  declare outletSeatingTypeId: number;

  @BelongsTo(() => OutletSeatingTypeDbModel)
  declare OutletSeatingType?: OutletSeatingTypeDbModel;

  @AllowNull(true)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(true)
  @Column
  declare minPax: number;

  @AllowNull(true)
  @Column
  declare maxPax: number;

  @Column
  declare originalPrice: number;

  @Column
  declare price: number;

  @Default(false)
  @Column
  declare isPrivate: boolean;

  @AllowNull(true)
  @Column
  declare image: string;

  @AllowNull(true)
  @Column
  declare blockTime: string;

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

  @HasMany(() => OutletTableSectionDbModel)
  declare OutletTableSection?: OutletTableSectionDbModel[];

  @BelongsToMany(() => OutletTableDbModel, {
    through: () => OutletTableSectionDbModel,
  })
  declare OutletTable?: OutletTableDbModel[];
}
