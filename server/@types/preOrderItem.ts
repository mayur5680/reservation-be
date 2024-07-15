export interface PreOrderItemRequestPayload {
  name: string;
  sectionId?: string;
  outletId: number;
  price: number;
  dailyMaxQty: number;
  bookingMaxQty: Date;
  originalPrice?: number;
  creditCardHoldAmount?: string;
  image?: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  repeatOn: string;
}
