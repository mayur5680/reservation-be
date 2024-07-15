"use strict";

import {
  Column,
  PrimaryKey,
  Model,
  AutoIncrement,
  Table,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  Default,
  HasMany,
  DeletedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";

import {
  UserDbModel,
  OutletUserDbModel,
  OutletTagDbModel,
  OutletTimeSlotDbModel,
  OutletTimeSlotOverrideDbModel,
  OutletSeatingTypeDbModel,
  OutletSeatTypeDbModel,
  SectionDbModel,
  CompanyDbModel,
} from "./";

@Table({
  tableName: "Outlet",
  freezeTableName: true,
})
export class OutletDbModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  declare id: number;

  @Column
  declare name: string;

  @AllowNull(true)
  @ForeignKey(() => CompanyDbModel)
  @Column
  declare companyId: number;

  @BelongsTo(() => CompanyDbModel)
  declare Company?: CompanyDbModel;

  @Column
  declare description: string;

  @Column
  declare address1: string;

  @AllowNull(true)
  @Column
  declare address2: string;

  @Column
  declare postcode: string;

  @Column
  declare latitude: string;

  @Column
  declare longitude: string;

  @Column
  declare phone: string;

  @Column
  declare email: string;

  @Column
  declare googlePlaceId: string;

  @Column
  declare gst: string;

  @Column
  declare rebookingTableInterval: string;

  @AllowNull(true)
  @Column
  declare timeSlotInterval: string;

  @AllowNull(true)
  @Column
  declare timezone: string;

  @Default(false)
  @Column
  declare allowOrder: boolean;

  @Default(false)
  @Column
  declare allowBooking: boolean;

  @AllowNull(true)
  @Column
  declare image: string;

  @AllowNull(true)
  @Column
  declare paxSpacing: number;

  @AllowNull(true)
  @Column
  declare ivrsPhoneNo: string;

  @AllowNull(true)
  @Column
  declare blockTime: string;

  @AllowNull(true)
  @Column
  declare chopeName: string;

  @AllowNull(true)
  @Column
  declare oddleName: string;

  @AllowNull(true)
  @Column
  declare SipCode: string;

  @ForeignKey(() => UserDbModel)
  @Column
  declare createdBy: number;

  @ForeignKey(() => UserDbModel)
  @Column
  declare updatedBy: number;

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

  @BelongsTo(() => UserDbModel, {
    targetKey: "id",
    foreignKey: "updatedBy",
  })
  declare User?: UserDbModel;

  @HasMany(() => OutletUserDbModel)
  declare OutletUser?: OutletUserDbModel[];

  @HasMany(() => OutletTagDbModel)
  declare OutletTag?: OutletTagDbModel[];

  @HasMany(() => OutletTimeSlotDbModel)
  declare OutletTimeSlot?: OutletTimeSlotDbModel[];

  @HasMany(() => OutletTimeSlotOverrideDbModel)
  declare OutletTimeSlotOverride?: OutletTimeSlotOverrideDbModel[];

  @HasMany(() => OutletSeatingTypeDbModel)
  declare OutletSeatingType?: OutletSeatingTypeDbModel[];

  @HasMany(() => OutletSeatTypeDbModel)
  declare OutletSeatType?: OutletSeatTypeDbModel[];

  @HasMany(() => SectionDbModel)
  declare Section?: SectionDbModel[];
}
