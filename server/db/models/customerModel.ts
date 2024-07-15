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
  HasMany,
  ForeignKey,
  BelongsTo,
  DataType,
} from "sequelize-typescript";

import {
  CustomerLogsDbModel,
  OutletDbModel,
  OutletInvoiceDbModel,
  UserDbModel,
} from ".";

@Table({
  tableName: "Customer",
  freezeTableName: true,
})
export class CustomerDbModel extends Model {
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
  declare name: string;

  @AllowNull(true)
  @Column
  declare lastName: string;

  @AllowNull(true)
  @Column
  declare email: string;

  @AllowNull(false)
  @Column
  declare mobileNo: string;

  @AllowNull(true)
  @Column
  declare salutation: string;

  @AllowNull(true)
  @Column
  declare gender: string;

  @AllowNull(true)
  @Column
  declare dob: Date;

  @AllowNull(true)
  @Column
  declare age: number;

  @AllowNull(true)
  @Column
  declare address: string;

  @AllowNull(true)
  @Column
  declare postalCode: string;

  @AllowNull(true)
  @Column
  declare programName: string;

  @AllowNull(true)
  @Column
  declare activationTerminal: string;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare averageSpend: number;

  @AllowNull(true)
  @UpdatedAt
  @Column
  declare lastTransactionDate: Date;

  @AllowNull(true)
  @Column
  declare tags: string;

  @AllowNull(true)
  @Column
  declare notes: string;

  @AllowNull(true)
  @Column({ type: DataType.DECIMAL(10, 2) })
  declare eatPoints: number;

  @AllowNull(true)
  @Column
  declare noOfRefferalSignUp: number;

  @AllowNull(true)
  @Column
  declare noOfRefferalPurchased: number;

  @AllowNull(true)
  @Column
  declare customerCompanyName: string;

  @Default(false)
  @Column
  declare isPrivateTableBooked: boolean;

  @AllowNull(true)
  @Column
  declare stripeId: string;

  @AllowNull(true)
  @Column
  declare stripeJSON: string;

  @Default(false)
  @Column
  declare isOPT: boolean;

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

  @HasMany(() => OutletInvoiceDbModel)
  declare OutletInvoice?: OutletInvoiceDbModel[];

  @HasMany(() => CustomerLogsDbModel)
  declare CustomerLogs?: CustomerLogsDbModel[];
}
