export interface FilterCustomerReservation {
  companyIds: number[];
  filter: string;
}

export interface CustomerContentChanges {
  filedName: string;
  oldValue: string;
  newValue: string;
}

export interface ContentChangesPayload {
  name: string;
  contentChange: CustomerContentChanges[];
}

export interface NoShowAndCancelation {
  noShow: number;
  cancelation: number;
}
