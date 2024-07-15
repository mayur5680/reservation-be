"use strict";

import {
  Column,
  PrimaryKey,
  Model,
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
  OutletInvoiceDbModel,
  CustomerDbModel,
  OutletDbModel,
  TicketingDbModel,
} from ".";

@Table({
  tableName: "Payment",
  freezeTableName: true,
})
export class PaymentDbModel extends Model {
  @PrimaryKey
  @Column
  declare sessionId: string;

  @AllowNull(false)
  @ForeignKey(() => CustomerDbModel)
  @Column
  declare customerId: number;

  @BelongsTo(() => CustomerDbModel)
  declare Customer?: CustomerDbModel;

  @AllowNull(false)
  @ForeignKey(() => OutletDbModel)
  @Column
  declare outletId: number;

  @BelongsTo(() => OutletDbModel)
  declare Outlet?: OutletDbModel;

  @AllowNull(false)
  @Column
  declare request: string;

  @AllowNull(true)
  @Column
  declare client_secret: string;

  @AllowNull(false)
  @Column
  declare sessionResponse: string;

  @AllowNull(true)
  @ForeignKey(() => OutletInvoiceDbModel)
  @Column
  declare outletInvoiceId: string;

  @BelongsTo(() => OutletInvoiceDbModel)
  declare OutletInvoice?: OutletInvoiceDbModel;

  @Default(false)
  @Column
  declare is_Success: boolean;

  @Default(false)
  @Column
  declare is_Event: boolean;

  @AllowNull(true)
  @ForeignKey(() => TicketingDbModel)
  @Column
  declare ticketingId: number;

  @BelongsTo(() => TicketingDbModel)
  declare Ticketing?: TicketingDbModel;

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
