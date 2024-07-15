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
} from "sequelize-typescript";

import {
  UserDbModel,
  SeatingTypeDbModel,
  OutletDbModel,
  OutletTableDbModel,
  GroupTableDbModel,
} from ".";

@Table({
  tableName: "OutletSeatingType",
  freezeTableName: true,
})
export class OutletSeatingTypeDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column({
    unique: "OutletSeatingType_seatingTypeId_outletId_key",
  })
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @ForeignKey(() => SeatingTypeDbModel)
  @Column({
    unique: "OutletSeatingType_seatingTypeId_outletId_key",
  })
  declare seatingTypeId: number;

  @BelongsTo(() => SeatingTypeDbModel)
  declare SeatingType?: SeatingTypeDbModel;

  @AllowNull(true)
  @Column
  declare image: string;

  @AllowNull(true)
  @Column
  declare height: string;

  @AllowNull(true)
  @Column
  declare width: string;

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

  @HasMany(() => OutletTableDbModel)
  declare OutletTable?: OutletTableDbModel[];

  @HasMany(() => GroupTableDbModel)
  declare GroupTable?: GroupTableDbModel[];
}
