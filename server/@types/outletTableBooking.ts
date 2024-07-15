import {
  OutletTableDbModel,
  OutletInvoiceDbModel,
  GroupPossibilityDbModel,
} from "../db/models";

export interface BookingGroupPossibilities extends GroupPossibilityDbModel {
  possibilityId: number;
  totalNoOfPerson: string;
  totalBookingCount: string;
}

export interface OutletTableBookingPayload {
  outletInvoice: OutletInvoiceDbModel;
  outletTable: OutletTableDbModel[];
}

export interface checkPossibiltyPayload {
  id: number;
  outletTableIds: number[];
}
