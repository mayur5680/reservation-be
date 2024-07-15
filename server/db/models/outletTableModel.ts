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
  TableDbModel,
  OutletSeatingTypeDbModel,
  OutletSeatTypeDbModel,
  UserDbModel,
  OutletGroupTableDbModel,
  OutletTableBookingDbModel,
  OutletTableSectionDbModel,
} from ".";

@Table({
  tableName: "OutletTable",
  freezeTableName: true,
})
export class OutletTableDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @ForeignKey(() => TableDbModel)
  @Column
  declare tableId: number;

  @BelongsTo(() => TableDbModel)
  declare Table?: TableDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletSeatingTypeDbModel)
  @Column
  declare outletSeatingTypeId: number;

  @BelongsTo(() => OutletSeatingTypeDbModel)
  declare OutletSeatingType?: OutletSeatingTypeDbModel;

  @AllowNull(true)
  @ForeignKey(() => OutletSeatTypeDbModel)
  @Column
  declare outletSeatTypeId: number;

  @BelongsTo(() => OutletSeatTypeDbModel)
  declare OutletSeatType?: OutletSeatTypeDbModel;

  @AllowNull(false)
  @Column
  declare xPosition: number;

  @AllowNull(false)
  @Column
  declare yPosition: number;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(true)
  @Column
  declare minimumSpendAmount: number;

  @AllowNull(true)
  @Column
  declare perPaxUnitDeposit: number;

  @Default(false)
  @Column
  declare isPrivate: boolean;

  @AllowNull(true)
  @Column
  declare image: string;

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

  @HasMany(() => OutletGroupTableDbModel)
  declare OutletGroupTable?: OutletGroupTableDbModel[];

  @HasMany(() => OutletTableBookingDbModel)
  declare OutletTableBooking?: OutletTableBookingDbModel[];

  @HasMany(() => OutletTableSectionDbModel)
  declare OutletTableSection?: OutletTableSectionDbModel[];
}
