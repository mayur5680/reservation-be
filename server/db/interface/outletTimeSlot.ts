"use strict";

import { SectionDbModel } from "../models";

export interface OutletTimeSlot {
  id?: number;
  outletId: number;
  sectionId: number;
  dayofweek: number;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
  Section?:SectionDbModel
}
