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

import { OutletDbModel, UserDbModel } from ".";

@Table({
  tableName: "Ticketing",
  freezeTableName: true,
})
export class TicketingDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @AllowNull(false)
  @Column
  declare name: string;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @Column
  declare startDate: Date;

  @AllowNull(false)
  @Column
  declare endDate: Date;

  @AllowNull(false)
  @Column
  declare openingTime: string;

  @AllowNull(false)
  @Column
  declare closingTime: string;

  @AllowNull(false)
  @Column
  declare amount: number;

  @AllowNull(false)
  @Column
  declare noOfPerson: number;

  @AllowNull(false)
  @Column
  declare ticketMaxQuantity: number;

  @AllowNull(true)
  @Column
  declare description: string;

  @AllowNull(false)
  @Column
  declare timeSlotInterval: string;

  @Default(false)
  @Column
  declare blockSchedule: boolean;

  @Default(false)
  @Column
  declare blockTable: boolean;

  @Default(false)
  @Column
  declare prePayment: boolean;

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
}
