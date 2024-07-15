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
  OutletSeatingTypeDbModel,
  UserDbModel,
  GroupPossibilityDbModel,
  GroupSequenceTableDbModel,
} from ".";

@Table({
  tableName: "GroupTable",
  freezeTableName: true,
})
export class GroupTableDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => OutletSeatingTypeDbModel)
  @Column
  declare outletSeatingTypeId: number;

  @BelongsTo(() => OutletSeatingTypeDbModel)
  declare OutletSeatingType?: OutletSeatingTypeDbModel;

  @AllowNull(true)
  @Column
  declare name: string;

  @AllowNull(true)
  @Column
  declare minPax: number;

  @AllowNull(true)
  @Column
  declare maxPax: number;

  @AllowNull(true)
  @Column
  declare description: string;

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

  @HasMany(() => GroupPossibilityDbModel)
  declare GroupPossibility?: GroupPossibilityDbModel;

  @HasMany(() => GroupSequenceTableDbModel)
  declare GroupSequenceTable?: GroupSequenceTableDbModel;
}
