"use strict";

export interface GroupTable {
  id?: number;
  outletSeatingTypeId: number;
  name?: string;
  minPax?: number;
  maxPax?: number;
  description?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
