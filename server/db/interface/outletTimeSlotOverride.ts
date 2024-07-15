"use strict";

export interface OutletTimeSlotOverride {
  id?: number;
  outletId: number;
  sectionId: number;
  dayofweek: number;
  effectiveFrom: Date;
  effectiveTo: Date;
  openingTime?: string;
  closingTime?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
