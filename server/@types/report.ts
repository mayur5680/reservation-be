import {
  BookingStatus,
  BookingType,
  CustomerReportFilter,
  ReservationReport,
} from "../context";

//reservation Report
export interface ReservationReportPayload {
  companyIds: number[];
  fromDate: Date;
  toDate: Date;
  mealType: string[];
  status: BookingStatus[];
  bookingType: BookingType[];
  filter: ReservationReport;
}

export interface MealTypes {
  mealType: string;
  totalNumberOfPerson?: number;
  totalNumberOfReservation: number;
  totalNumberOfPreoderItem?: number;
}

export interface OutletResponse {
  name: string;
  mealTypes: MealTypes[];
}

export interface ReservationReportResponse {
  Outlet: OutletResponse[];
  Total: MealTypes[];
  noShow?: number;
}

//Customer Resport//
export interface CustomerReportPayload {
  companyIds: number[];
  fromDate: Date;
  toDate: Date;
  filter: CustomerReportFilter;
  outletIds?: number[];
}

export interface CustomerReportCrossGroupBy {
  customerId: number;
  outletID: number;
  totalBookingCount: string;
}

export interface CustomerTotalDines {
  index: string;
  totalDines: number;
}

export interface CustomerReportOutletResonse {
  name: string;
  customerTotalDines: CustomerTotalDines[];
}

export interface CustomerReportResonse {
  Outlet: CustomerReportOutletResonse[];
  Total: CustomerTotalDines[];
}

export interface CustomerReportCrossGroupBy {
  email: string;
  mobileNo: string;
  count: string;
}

//Event Report//

export interface GroupEventReportPayload {
  companyIds: number[];
  fromDate: Date;
  toDate: Date;
  mealType: string[];
}

export interface EventTypes {
  mealType: string;
  totalNumberOfPerson: number;
  totalNumberOfReservation: number;
  totalAmount: number;
}

export interface OutletsEvent {
  name: string;
  mealTypes: EventTypes[];
}

export interface GroupEventReportResponse {
  Outlet: OutletsEvent[];
  Total: EventTypes[];
}

export interface SingleEventReportPayload {
  fromDate: Date;
  toDate: Date;
  mealType: string[];
  outletId: number;
}

export interface SingleEventReportResponse {
  Date: OutletsEvent[];
  Total: EventTypes[];
}
