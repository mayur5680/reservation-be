"use strict";

export interface OutletTableSection {
  id?: number;
  tableSectionId: number;
  outletTableId: number;
  isPrivate?: boolean;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}
