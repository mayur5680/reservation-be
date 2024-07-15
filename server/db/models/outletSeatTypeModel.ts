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

import { UserDbModel, SeatTypeDbModel, OutletDbModel } from ".";

@Table({
  tableName: "OutletSeatType",
  freezeTableName: true,
})
export class OutletSeatTypeDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column({
    unique: "OutletSeatType_seatTypeId_outletId_key",
  })
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @ForeignKey(() => SeatTypeDbModel)
  @Column({
    unique: "OutletSeatType_seatTypeId_outletId_key",
  })
  declare seatTypeId: number;

  @BelongsTo(() => SeatTypeDbModel)
  declare SeatType?: SeatTypeDbModel;

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
}
