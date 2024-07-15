import { Outlet, Customer, Coupon } from "../db/interface";
import {
  CouponDbModel,
  OutletDbModel,
  OutletTableDbModel,
  OutletTagDbModel,
  UserDbModel,
} from "../db/models";

export interface TimeSlot {
  dayOfWeek: string;
  openingTime: string;
  closingTime: string;
}

export interface TimePeriod {
  openingTime: string;
  closingTime: string;
}
export interface TradingHours {
  dayofweek: string;
  timePeriods: TimePeriod[];
  date: Date;
}

export interface DiscountTimeSlot {
  timeSlot: string;
  coupon: Coupon[];
}

export interface FutureTradingHours extends TradingHours {
  timeSlots?: string[];
}

export interface GetOutlets extends Outlet {
  TradingHours: TradingHours[];
  OutletTag: OutletTagDbModel[];
}

export interface TimeSlotRequest {
  outletId: number;
  date: Date;
  noOfAdult: number;
  noOfChild: number;
  checkPax?: boolean;
}

export interface Step4Payload {
  date: Date;
  exactTime: string;
  noOfAdult: number;
  noOfChild: number;
}

export interface OutletInfoRequest extends TimeSlotRequest {
  preferredTime: string;
}

export interface OutletTimeSlotInfo extends Outlet {
  tradingHours: FutureTradingHours[];
  discountTimeSlot?: DiscountTimeSlot[];
  isValidTableRequest: boolean;
  finalFutureTradingHours: TradingHours[];
}
export interface BasketItem {
  itemId: number;
  qty: number;
  name?: string;
  price?: number;
  originalAmount?: number;
  image?: string;
  description?: string;
  total?: number;
  originalTotalAmount?: number;
}

export interface Basket {
  total?: number;
  items: BasketItem[];
  originalTotalAmount?: number;
}

export interface DiningOptionsPayload {
  diningOptionId: number;
  diningOptionQty: number;
  name?: string;
  price?: number;
  originalAmount?: number;
  image?: string;
  total?: number;
  originalTotalAmount?: number;
}

export interface PrivateRoomPayload {
  id: number;
  name?: string;
  price?: number;
  originalPrice?: number;
  image?: string;
  overridePrivateRoom?: boolean;
}

export interface BookTablePayload extends OutletInfoRequest {
  exactTime: string;
  name: string;
  lastName?: string;
  email: string;
  mobileNo: string;
  customerCompanyName?: string;
  bookingType: string;
  occasion?: string;
  seatingPreference?: string;
  specialRequest?: string;
  reservationNotes?: string;
  salutation?: string;
  promocode?: string;
  isOPT?: boolean;
  diningOptions: DiningOptionsPayload[];
  dietaryRestriction?: string;
  basket: Basket;
  privateRoom: PrivateRoomPayload | null;
  directPayment?: boolean;
}

export interface CardDetails {
  number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
}

export interface CustomerBookingPayload extends Customer {
  outlet: OutletDbModel;
  noOfPerson: number;
  noOfAdult: number;
  noOfChild: number;
  bookingStartTime: Date;
  bookingEndTime: Date;
  mealType?: string;
  bookingType: string;
  occasion?: string;
  seatingPreference?: string;
  specialRequest?: string;
  reservationNotes?: string;
  salutation?: string;
  promocode?: string;
  dietaryRestriction?: string;
  exactTime?: string;
  outletTable: OutletTableDbModel[];
  coupon?: CouponDbModel | null;
  image?: string;
  isOPT?: boolean;
  isPrivateTableBooked?: boolean;
  user?: UserDbModel;
  price?: number;
  chopeBookingId?: string;
}
