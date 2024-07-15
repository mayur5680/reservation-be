import { ErrorPayload } from "../@types/apiError";
import { Exceptions } from "../exception";

export const ExcludeAttributes = ["password", "deletedAt", "guid"];

export const ExcludeCompanyAttributes = [
  "mailChimpPublicKey",
  "mailChimpPrivateKey",
  "mailChimpUserName",
  "mailChimpStatus",
  "ivrsUserKey",
  "ivrsSecretKey",
  "twilioAccountSid",
  "twilioAuthToken",
  "twilioMessagingServiceSid",
];

export const ExcludeOutletAttributes = ["googlePlaceId", "gst", "ivrsPhoneNo"];

export const LogTypes = {
  SYSTEM_LOG: "SYSTEM_LOG",
  TRANSACTIONAL_EMAIL: "TRANSACTIONAL_EMAIL",
  IVRS: "IVRS",
  NEW_RESERVATION: "NEW_RESERVATION",
};

export const LogStatus = {
  SUCCESS: "SUCCESS",
  FAIL: "FAIL",
};

export const Actions = {
  LOGGED_IN: "LOGGED_IN",
  CREATED: "CREATED",
  UPDATED: "UPDATED",
  DELETED: "DELETED",
  GET: "GET",
  SEND: "SEND",
  CALL: "CALL",
};

export enum StatusCode {
  SUCCESS = 200,
  CREATED = 201,
  SERVER_ERROR = 500,
  UNAUTHORIZED = 401,
  NOTFOUND = 404,
  BAD_REQUEST = 400,
}
export enum VerificationType {
  EMAIL = "EMAIL",
  PHONE = "PHONE",
}

export enum Loglevel {
  ERROR = "error",
  WARN = "warn",
  INFO = "info",
  DEBUG = "debug",
  SILLY = "silly",
}

export enum Day {
  Sunday = "Sunday",
  Monday = "Monday",
  Tuesday = "Tuesday",
  Wednesday = "Wednesday",
  Thursday = "Thursday",
  Friday = "Friday",
  Saturday = "Saturday",
}

export enum BookingSource {
  WEB = "WEB",
  INSTAGRAM = "INSTAGRAM",
  MANUAL = "MANUAL",
  CHOPE = "CHOPE",
  ODDLE = "ODDLE",
}

export enum BookingStatus {
  BOOKED = "BOOKED",
  CONFIRMED = "CONFIRMED",
  POSTPONED = "POSTPONED",
  CANCELLED = "CANCELLED",
  NOSHOW = "NOSHOW",
  SEATED = "SEATED",
  LEFT = "LEFT",
  ERROR = "ERROR",
}

export enum ModuleName {
  OUTLETMANAGEMENT = "OutletManagement",
  MEALTYPE = "MealType",
  MEALTIMING = "MealTiming",
  CLOSURE = "Closure",
  TIMINGPROMO = "TimingPromo",
  PREORDER = "PreOrder",
  EMAILTEMPLATE = "EmailTemplate",
  DINNINGOPTION = "DinningOption",
  SMSTEMPLATE = "SmsTemplate",
  SEATPLANS = "SeatPlans",
  SPACES = "Spaces",
  SEATTYPE = "SeatType",
  TABLEMANAGEMENT = "TableManagement",
  TAGCATEGORY = "TagCategory",
  TAGS = "Tags",
  AUTOTAGGING = "AutoTagging",
  RESERVEDKEYWORDS = "ReservedKeywords",
  RESERVATIONMANAGEMENT = "ReservationManagement",
  CALLMANAGEMENT = "CallManagement",
  TICKETING = "Ticketing",
  CUSTOMERMANAGEMENT = "CustomerManagement",
  MATERIALS = "Materials",
  MATERIALCATEGORY = "MaterialCategory",
  MATERIALSUBCATEGORY = "MaterialSubCategory",
  USERGROUP = "UserGroup",
  USERLIST = "UserList",
  USERGROUPACCESS = "UserGroupAccess",
  COMPANYMANAGEMENT = "CompanyManagement",
  SUPERUSER = "SuperUser",
}

export enum ComapnyModule {
  IVRSCONFIGURATION = "IvrsConfiguration",
  MARKETING = "Marketing",
  REPORTS = "Reports",
}

export enum CustomerReservation {
  ALL = "ALL",
  UPCOMING = "UPCOMING",
  PAST = "PAST",
}

export enum CustomerLogType {
  SMS = "SMS",
  ACTIVITY = "ACIVITY",
}

export enum CustomerLogTypePurpose {
  CONFIRMATION = "Confirmation of booking",
}

export enum CustomerLogPageTitle {
  CUSTOMER_PROFILE = "Customer Profile",
  CUSTOMER_RESERVATION = "Customer Reservation",
}

export enum EmailActionType {
  RESERVATION_MAIL = "BOOKED",
  CONFIRMATION_RESERVATION = "CONFIRMED",
  USER_CREATION = "User Creation",
  SUPERUSER_CREATION = "Superuser Creation",
  FORGOT_PASSWORD = "Forgot Password",
}

export enum CustomerSalutation {
  MR = "Mr.",
  MRS = "Mrs.",
  MS = "Ms.",
  MISS = "Miss.",
  MDM = "Mdm.",
  DR = "Dr.",
}

export enum CustomerGender {
  MALE = "Male",
  FEMALE = "Female",
}

export enum ReservationReport {
  UPCOMING = "UPCOMING",
  PAST = "PAST",
}

export enum CustomerReportFilter {
  FREQUENT = "FREQUENT_CUSTOMER",
  CROSS = "CROSS_CUSTOMER",
}

export enum BookingType {
  NORMAL_RESERVATION = "NORMAL_RESERVATION",
  TICKETING_EVENT = "TICKETING_EVENT",
  PRIVATE_ROOM = "PRIVATE_ROOM",
  PRIVATE_EVENT = "PRIVATE_EVENT",
}

export enum SMSTemplateTypes {
  BOOKED = "BOOKED",
  CONFIRMED = "CONFIRMED",
  RESERVATION = "RESERVATION",
}

export enum EmailTemplateTypes {
  BOOKED = "BOOKED",
  CONFIRMED = "CONFIRMED",
  BOOKED_PAYMENT = "BOOKED_PAYMENT",
}

export const IvrsCustomerDial = {
  1: "SMS",
  2: "Voicemail",
  3: "CallBack",
  4: "Press 4",
};

export const CronJobTimeZone = "Asia/Singapore";

export const FrontEndBaseURL = "https://creat.sg";

export const BackEndBaseURL = "https://api.creat.sg";

export const errorResponse = (
  message: string,
  statusCode: number,
  res: any,
  devMessage: any = null
) => {
  if (!devMessage) devMessage = message;
  return res.status(statusCode).send({
    message,
    devMessage,
    statusCode,
  });
};

export const catchErrorResponse = (error: unknown, res: any) => {
  const e = error as Error;
  const apiError = e as unknown as ErrorPayload;

  let message: any = Exceptions.INTERNAL_ERROR;
  let devMessage: any = e.message;
  let statusCode = StatusCode.SERVER_ERROR;

  //Check it's a normal error or custom error
  const existException = (value: string) =>
    Object.values(Exceptions).includes(value as any);

  if (existException(apiError.message)) {
    if (apiError.message === Exceptions.CUSTOM_ERROR) {
      // If it's a custom Error
      message = apiError.devMessage;
      devMessage = null;
      statusCode = apiError.statusCode;
    } else {
      message = apiError.message;
      devMessage = null;
      statusCode = apiError.statusCode;
    }
  }

  return errorResponse(message, statusCode, res, devMessage);
};
