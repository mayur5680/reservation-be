import { Sequelize } from "sequelize";
import { BackEndBaseURL, BookingStatus, FrontEndBaseURL } from "../../context";
import { OutletDbModel, OutletInvoiceDbModel } from "../../db/models";
import { shortenUrl } from "./common";
let moment = require("moment-timezone");

export const replaceHtml = async (
  Outlet: OutletDbModel,
  invoice: OutletInvoiceDbModel | null = null,
  body: string,
  sequelize: Sequelize,
  isEmail = true
): Promise<string> => {
  try {
    //let shortenURL = await shortenUrl(Outlet as OutletDbModel);

    const mapObj: any = {
      "{{BookingStartTime}}":
        invoice && invoice.bookingStartTime
          ? moment(invoice.bookingStartTime)
              .tz(invoice.Outlet?.timezone)
              .format("hh:mm a")
          : "N/A",

      "{{BookingEndTime}}":
        invoice && invoice.bookingEndTime
          ? moment(invoice.bookingEndTime)
              .tz(invoice.Outlet?.timezone)
              .format("hh:mm a")
          : "N/A",

      "{{BookingDate}}":
        invoice && invoice.bookingDate
          ? moment(invoice.bookingDate)
              .tz(invoice.Outlet?.timezone)
              .format("DD-MM-YYYY")
          : "N/A",

      "{{Salutation}}":
        invoice && invoice.Customer?.salutation
          ? invoice.Customer?.salutation
          : "N/A",

      "{{CustomerName}}":
        invoice && invoice.Customer?.name ? invoice.Customer?.name : "N/A",

      "{{CustomerNumber}}":
        invoice && invoice.Customer?.mobileNo
          ? invoice.Customer?.mobileNo
          : "N/A",

      "{{CustomerEmail}}":
        invoice && invoice.Customer?.email ? invoice.Customer?.email : "N/A",

      "{{Pax}}": invoice && invoice.noOfPerson ? invoice.noOfPerson : "N/A",

      "{{BookingType}}":
        invoice && invoice.bookingType ? invoice.bookingType : "N/A",

      "{{DietaryRestriction}}":
        invoice && invoice.dietaryRestriction
          ? JSON.parse(invoice.dietaryRestriction)
          : "N/A",

      "{{SpecialRequest}}":
        invoice && invoice.specialRequest ? invoice.specialRequest : "N/A",

      "{{Source}}": invoice && invoice.source ? invoice.source : "N/A",

      "{{Status}}": invoice && invoice.status ? invoice.status : "N/A",

      "{{Outlet}}": Outlet.name ? Outlet?.name : "N/A",

      "{{Company}}": Outlet.Company?.name ? Outlet.Company?.name : "N/A",

      "{{Occasion}}": invoice && invoice.occasion ? invoice.occasion : "N/A",

      "{{TablePreference}}":
        invoice && invoice.seatingPreference
          ? invoice.seatingPreference
          : "N/A",

      "{{DepositAmount}}":
        invoice && invoice.totalPaidAmount ? invoice.totalPaidAmount : "N/A",

      "{{TotalAmount}}":
        invoice && invoice.originalTotalAmount
          ? invoice.originalTotalAmount
          : "N/A",

      "{{RemainingAmount}}":
        invoice && invoice.remainingAmount ? invoice.remainingAmount : "N/A",

      "{{ConfirmationLink}}": isEmail
        ? `<a href="${BackEndBaseURL}/api/invoice/${
            invoice ? invoice.id : "N/A"
          }/status/${BookingStatus.CONFIRMED}">Confirm</a>`
        : await shortenUrl(
            `${BackEndBaseURL}/api/invoice/${
              invoice ? invoice.id : "N/A"
            }/status/${BookingStatus.CONFIRMED}`,
            sequelize
          ),

      "{{CancellationLink}}": isEmail
        ? `<a href="${BackEndBaseURL}/api/invoice/${
            invoice ? invoice.id : "N/A"
          }/status/${BookingStatus.CANCELLED}">Cancel</a>`
        : await shortenUrl(
            `${BackEndBaseURL}/api/invoice/${
              invoice ? invoice.id : "N/A"
            }/status/${BookingStatus.CANCELLED}`,
            sequelize
          ),

      "{{ConfirmOrCancelLink}}": isEmail
        ? `<a href="${FrontEndBaseURL}/invoice/${
            invoice ? invoice.id : "N/A"
          }">Confirm</a>`
        : await shortenUrl(
            `${FrontEndBaseURL}/invoice/${invoice ? invoice.id : "N/A"}`,
            sequelize
          ),

      "{{ReservationLink}}": await shortenUrl(
        `${FrontEndBaseURL}/HotelReservation/${Outlet?.Company?.key}/outlet/${Outlet?.id}`,
        sequelize
      ),
    };

    let html = body;
    Object.keys(mapObj).forEach((key) => {
      const reg = new RegExp(key, "g");
      html = html.replace(reg, mapObj[key]);
    });

    return html;
  } catch (error) {
    throw error;
  }
};
