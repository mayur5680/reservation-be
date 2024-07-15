export interface GetCouponRequest {
  fromDate?: Date;
  toDate?: Date;
}

export interface TimeSlotDetails {
  openingTime?: string;
  closingTime?: string;
  timeSlotInterval: string;
}
