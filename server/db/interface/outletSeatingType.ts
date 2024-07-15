"use strict";

export interface OutletSeatingType {
  id?: number;
  outletId: number;
  seatingTypeId: number;
  image?: string;
  height?: string;
  width?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
