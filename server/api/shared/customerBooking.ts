import Stripe from "stripe";
import { OutletTableBookingPayload } from "../../@types/outletTableBooking";
import {
  BookingSource,
  BookingStatus,
  StatusCode,
  Actions,
  Loglevel,
  LogTypes,
  CustomerLogType,
  CustomerLogPageTitle,
  EmailActionType,
  LogStatus,
  EmailTemplateTypes,
} from "../../context";
import { getGuid, sendMail } from "../../context/service";
import {
  Customer,
  CustomerLogs,
  OutletInvoice,
  Payment,
  SystemLog,
} from "../../db/interface";
import {
  CustomerDbInterface,
  EmailTemplateDbInterface,
  OutletInvoiceDbInterface,
  OutletTableBookingDbInterface,
  OutletTableDbInterface,
  CustomerLogsDbInterface,
  SystemLogDbInterface,
  PaymentDbInterface,
} from "../../db-interfaces";
import {
  BookTablePayload,
  CustomerBookingPayload,
} from "../../@types/customerBooking";
import {
  OutletDbModel,
  OutletInvoiceDbModel,
  OutletTableDbModel,
  PaymentDbModel,
} from "../../db/models";
import { Sequelize } from "sequelize";
import { Log } from "../../context/Logs";
import {
  creatStripeCheckoutSession,
  creatStripeCustomer,
} from "../stripePayment";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
import { replaceHtml } from "./emailTemplate";
import {
  BookTicketPayload,
  CustomerBookingTicketPayload,
} from "../../@types/ticketBooking";
import {
  createOrUpdateCustomer,
  customerAverageSpend,
  customerContentChanges,
  customerGenderBySalutation,
} from "./customer";
import { basketTransform, getAdminUser } from "./";
import { isEmpty } from "lodash";
import { ChopeBookingPayload } from "../../@types/chope";

export const CustomerBooking = async (
  customerBooking: CustomerBookingPayload,
  bookTablePayload: BookTablePayload,
  sequelize: Sequelize,
  uniqueId: string,
  checkPayment: boolean = true
): Promise<OutletInvoiceDbModel | PaymentDbModel> => {
  let user = await getAdminUser(sequelize);
  try {
    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );

    const paymentDbInterface = new PaymentDbInterface(sequelize);

    customerBooking.dietaryRestriction = JSON.stringify(
      customerBooking.dietaryRestriction
    );

    let customerPayload: Customer = {
      name: customerBooking.name,
      lastName: customerBooking.lastName,
      email: customerBooking.email,
      mobileNo: customerBooking.mobileNo,
      outletId: customerBooking.outletId,
      salutation: customerBooking.salutation,
      isOPT: customerBooking.isOPT,
    };

    if (customerBooking.customerCompanyName) {
      customerPayload.customerCompanyName = customerBooking.customerCompanyName;
    }

    if (customerBooking.isPrivateTableBooked === true) {
      customerPayload.isPrivateTableBooked = true;
    }

    let customer = await createOrUpdateCustomer(
      customerPayload,
      user,
      sequelize,
      uniqueId
    );

    let amount = 0;
    let discountAmount = 0;

    const transformBasket = await basketTransform(
      bookTablePayload,
      customerBooking.outlet,
      uniqueId,
      sequelize
    );

    amount += Number(transformBasket.basket.total);

    const totalAmountBeforeDiscount = amount;

    if (customerBooking.coupon) {
      discountAmount = (amount * customerBooking.coupon.discountAmount) / 100;
    }

    const totalAmount = amount - discountAmount;

    Log.writeLog(
      Loglevel.INFO,
      "CustomerBooking",
      "TotalAmount",
      totalAmount,
      uniqueId
    );

    if (totalAmount > 0 && checkPayment) {
      if (!customer.stripeId) {
        customer = await creatStripeCustomer(customer, uniqueId);
      }

      //create a checkout session via stripe
      const stripeCheckout: Stripe.Response<Stripe.Checkout.Session> | any =
        await creatStripeCheckoutSession(customer, uniqueId);

      const paymentPayload: Payment = {
        sessionId: stripeCheckout.id,
        customerId: customer.id,
        outletId: customerBooking.outlet.id,
        request: JSON.stringify(bookTablePayload),
        client_secret: stripeCheckout.client_secret,
        sessionResponse: JSON.stringify(stripeCheckout),
      };

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        "paymentPayload",
        paymentPayload,
        uniqueId
      );

      const creatPayment = await paymentDbInterface.create(paymentPayload);
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        "creatPayment",
        creatPayment,
        uniqueId
      );

      return creatPayment;
    }

    const invoicePayload: OutletInvoice = {
      id: getGuid(),
      customerId: customer.id,
      outletId: customerBooking.outletId,
      noOfPerson: customerBooking.noOfPerson,
      noOfAdult: customerBooking.noOfAdult,
      noOfChild: customerBooking.noOfChild,
      bookingDate: customerBooking.bookingStartTime,
      bookingStartTime: customerBooking.bookingStartTime,
      bookingEndTime: customerBooking.bookingEndTime,
      bookingType: customerBooking.bookingType,
      mealType: customerBooking.mealType,
      occasion: customerBooking.occasion,
      image: customerBooking.image,
      seatingPreference: customerBooking.seatingPreference,
      specialRequest: customerBooking.specialRequest,
      reservationNotes: customerBooking.reservationNotes,
      promocode: customerBooking.promocode,
      dietaryRestriction: customerBooking.dietaryRestriction,
      couponId: customerBooking.coupon?.id,
      source: BookingSource.WEB,
      status: BookingStatus.BOOKED,
      customerCompanyName: customerBooking.customerCompanyName,
      dinningOptions: JSON.stringify(transformBasket.diningOptions),
      basket: JSON.stringify(transformBasket.basket.items),
      discountAmount,
      totalAmount,
      originalTotalAmount: Number(transformBasket.basket.originalTotalAmount),
      totalAmountBeforeDiscount,
      privateRoom: JSON.stringify(transformBasket.privateRoom),
      isPrivateTableBooked: customerBooking.isPrivateTableBooked,
    };
    Log.writeLog(
      Loglevel.INFO,
      "CustomerBooking",
      "invoicePayload",
      invoicePayload,
      uniqueId
    );

    let invoice: OutletInvoiceDbModel | null = null;
    await sequelize.transaction(async (transaction) => {
      invoice = await outletInvoiceDbInterface.create(
        invoicePayload,
        transaction
      );

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "Invoice Created",
        uniqueId
      );

      //Create TableBooking
      const outletTableBookingPayload: OutletTableBookingPayload = {
        outletInvoice: invoice,
        outletTable: customerBooking.outletTable,
      };

      const tableBooking = await outletTableBookingDbInterface.create(
        outletTableBookingPayload,
        customerBooking.outletId,
        customerBooking.bookingStartTime,
        customerBooking.bookingEndTime,
        BookingStatus.BOOKED,
        transaction
      );
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "TableBooking Created",
        uniqueId
      );

      //save last transaction date in customer
      if (customer) {
        customer.lastTransactionDate = invoice.createdAt;
        await customer?.save();
      }
    });

    if (!invoice) {
      throw new ApiError({
        message: Exceptions.INVALID_INVOICE,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    invoice = invoice as OutletInvoiceDbModel;
    await invoice.save();
    const getInvoice = await outletInvoiceDbInterface.getInvoiceById(
      invoice.id
    );

    //caculate and update averageSpend in customer
    await customerAverageSpend(customer.id, sequelize);

    const log: SystemLog = {
      type: LogTypes.NEW_RESERVATION,
      action: getInvoice.bookingType,
      module: " ",
      identifier: customer.email ? customer.email : customer.name,
      name: customer.name,
      guid: getGuid(),
      outletId: customerBooking.outlet.id,
      updatedBy: customerBooking.user ? customerBooking.user.id : user.id,
      status: LogStatus.SUCCESS,
      outletInvoiceId: getInvoice.id,
      callerId: getGuid(),
    };

    let systemLogDbInterface = new SystemLogDbInterface(sequelize);

    await systemLogDbInterface.create(log);

    //send mail
    let templateType = EmailTemplateTypes.BOOKED;

    if (getInvoice.totalAmount > 0) {
      templateType = EmailTemplateTypes.BOOKED_PAYMENT;
    }
    const emailTemplateDbInterface = new EmailTemplateDbInterface(sequelize);
    const emailTemplates =
      await emailTemplateDbInterface.getEmailTemplateByNameAndOutletId(
        customerBooking.outletId,
        templateType
      );

    if (!emailTemplates) {
      Log.writeExitLog(
        Loglevel.ERROR,
        "mailSending",
        Actions.SEND,
        getInvoice.outletId,
        "Temaplte not found",
        uniqueId,
        sequelize,
        LogTypes.SYSTEM_LOG,
        user,
        null
      );

      return getInvoice;
    }
    const body = await replaceHtml(
      getInvoice.Outlet as OutletDbModel,
      getInvoice,
      emailTemplates.body,
      sequelize
    );

    //check public key in company
    if (
      customerBooking.outlet.Company?.mailChimpUserName &&
      customerBooking.outlet.Company?.mailChimpPrivateKey
    ) {
      await sendMail(
        customer.email,
        body,
        sequelize,
        uniqueId,
        EmailActionType.RESERVATION_MAIL,
        customerBooking.outlet,
        emailTemplates.subject,
        getInvoice.id,
        `${customer.name} ${customer.lastName}`,
        customerBooking.outlet.Company.mailChimpUserName,
        customerBooking.outlet.Company.mailChimpPrivateKey
      );
    }

    return getInvoice;
  } catch (error) {
    throw error;
  }
};

export const CustomerBookingForListingView = async (
  customerBooking: CustomerBookingPayload,
  sequelize: Sequelize,
  uniqueId: string
): Promise<OutletInvoiceDbModel> => {
  let user = await getAdminUser(sequelize);
  try {
    const customerDbInterface = new CustomerDbInterface(sequelize);
    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );
    const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);

    customerBooking.dietaryRestriction = JSON.stringify(
      customerBooking.dietaryRestriction
    );

    let customerPayload: Customer = {
      name: customerBooking.name,
      lastName: customerBooking.lastName,
      email: customerBooking.email,
      mobileNo: customerBooking.mobileNo,
      outletId: customerBooking.outletId,
      salutation: customerBooking.salutation,
    };

    customerPayload = customerGenderBySalutation(customerPayload);

    if (isEmpty(customerPayload.email)) {
      customerPayload.email = null;
    }
    //Find or Create Customer
    let customer = await customerDbInterface.getCustomerbyEmailAndPhoneNo(
      customerPayload.email,
      customerPayload.mobileNo,
      customerPayload.outletId
    );

    //customerLogsPayload
    let customerLogsPayload: CustomerLogs | null = null;

    if (customer) {
      const updatedCustomer = (
        await customerDbInterface.updateCustomer(
          customer.id,
          user.id,
          customerPayload
        )
      ).toJSON();

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.UPDATED,
        "Customer Updated",
        uniqueId
      );
      const contentChange = customerContentChanges(customer, updatedCustomer);

      customerLogsPayload = {
        customerId: customer.id,
        logType: CustomerLogType.ACTIVITY,
        action: Actions.UPDATED,
        moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
        contentChange,
        updatedBy: user.id,
      };
    } else {
      customerPayload.updatedBy = user.id;
      customerPayload.createdBy = user.id;
      customer = await customerDbInterface.create(customerPayload);
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "Customer Created",
        uniqueId
      );
      customerLogsPayload = {
        customerId: customer.id,
        logType: CustomerLogType.ACTIVITY,
        action: Actions.CREATED,
        moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
        updatedBy: user.id,
      };
    }

    //Customer Log
    await customerLogsDbInterface.create(customerLogsPayload);

    const invoicePayload: OutletInvoice = {
      id: getGuid(),
      customerId: customer.id,
      outletId: customerBooking.outletId,
      noOfPerson: customerBooking.noOfPerson,
      noOfAdult: customerBooking.noOfAdult,
      noOfChild: customerBooking.noOfChild,
      bookingDate: customerBooking.bookingStartTime,
      bookingStartTime: customerBooking.bookingStartTime,
      bookingEndTime: customerBooking.bookingEndTime,
      bookingType: customerBooking.bookingType,
      mealType: customerBooking.mealType,
      occasion: customerBooking.occasion,
      image: customerBooking.image,
      seatingPreference: customerBooking.seatingPreference,
      specialRequest: customerBooking.specialRequest,
      reservationNotes: customerBooking.reservationNotes,
      promocode: customerBooking.promocode,
      dietaryRestriction: customerBooking.dietaryRestriction,
      source: BookingSource.MANUAL,
      status: BookingStatus.BOOKED,
      totalAmount: customerBooking.price,
      createdBy: customerBooking.user?.id,
      updatedBy: customerBooking.user?.id,
    };

    let invoice: OutletInvoiceDbModel | null = null;
    await sequelize.transaction(async (transaction) => {
      invoice = await outletInvoiceDbInterface.create(
        invoicePayload,
        transaction
      );

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "Invoice Created",
        uniqueId
      );

      //Create TableBooking
      const outletTableBookingPayload: OutletTableBookingPayload = {
        outletInvoice: invoice,
        outletTable: customerBooking.outletTable,
      };

      const tableBooking = await outletTableBookingDbInterface.create(
        outletTableBookingPayload,
        customerBooking.outletId,
        customerBooking.bookingStartTime,
        customerBooking.bookingEndTime,
        BookingStatus.BOOKED,
        transaction
      );
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "TableBooking Created",
        uniqueId
      );

      //save last transaction date in customer
      if (customer) {
        customer.lastTransactionDate = invoice.createdAt;
        await customer?.save();
      }
    });

    if (!invoice) {
      throw new ApiError({
        message: Exceptions.INVALID_INVOICE,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    invoice = invoice as OutletInvoiceDbModel;
    let getInvoice = (
      await outletInvoiceDbInterface.getInvoiceById(invoice.id)
    ).toJSON();

    getInvoice = {
      ...getInvoice,
      image: JSON.parse(getInvoice.image),
    };

    //caculate and update averageSpend in customer
    await customerAverageSpend(customer.id, sequelize);

    let templateType = EmailTemplateTypes.BOOKED;

    if (getInvoice.totalAmount > 0) {
      templateType = EmailTemplateTypes.BOOKED_PAYMENT;
    }

    const emailTemplateDbInterface = new EmailTemplateDbInterface(sequelize);
    const emailTemplates =
      await emailTemplateDbInterface.getEmailTemplateByNameAndOutletId(
        customerBooking.outletId,
        templateType
      );

    if (emailTemplates && customerBooking.outlet.Company?.mailChimpPrivateKey) {
      const body = await replaceHtml(
        getInvoice.Outlet as OutletDbModel,
        getInvoice,
        emailTemplates.body,
        sequelize
      );

      await sendMail(
        customer.email,
        body,
        sequelize,
        uniqueId,
        EmailActionType.RESERVATION_MAIL,
        customerBooking.outlet,
        emailTemplates.subject,
        getInvoice.id,
        `${customer.name} ${customer.lastName}`,
        customerBooking.outlet.Company?.mailChimpUserName,
        customerBooking.outlet.Company.mailChimpPrivateKey
      );
    }

    //Log Entry
    const log: SystemLog = {
      type: LogTypes.NEW_RESERVATION,
      action: getInvoice.bookingType,
      module: " ",
      identifier: customer.email ? customer.email : customer.name,
      name: customer.name,
      guid: getGuid(),
      outletId: customerBooking.outlet.id,
      updatedBy: customerBooking.user ? customerBooking.user.id : user.id,
      status: LogStatus.SUCCESS,
      outletInvoiceId: getInvoice.id,
      callerId: getGuid(),
    };

    let systemLogDbInterface = new SystemLogDbInterface(sequelize);

    await systemLogDbInterface.create(log);

    return getInvoice;
  } catch (error) {
    throw error;
  }
};

export const CustomerBookingForSeatingView = async (
  customerBooking: CustomerBookingPayload,
  sequelize: Sequelize,
  uniqueId: string
): Promise<OutletTableDbModel | null> => {
  let user = await getAdminUser(sequelize);
  try {
    const customerDbInterface = new CustomerDbInterface(sequelize);
    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );
    const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);

    let customerPayload: Customer = {
      name: customerBooking.name,
      lastName: customerBooking.lastName,
      email: customerBooking.email,
      mobileNo: customerBooking.mobileNo,
      outletId: customerBooking.outletId,
      salutation: customerBooking.salutation,
    };

    customerPayload = customerGenderBySalutation(customerPayload);

    if (isEmpty(customerPayload.email)) {
      customerPayload.email = null;
    }

    //Find or Create Customer
    let customer = await customerDbInterface.getCustomerbyEmailAndPhoneNo(
      customerPayload.email,
      customerPayload.mobileNo,
      customerPayload.outletId
    );

    //customerLogsPayload
    let customerLogsPayload: CustomerLogs | null = null;

    if (customer) {
      const updatedCustomer = (
        await customerDbInterface.updateCustomer(
          customer.id,
          user.id,
          customerPayload
        )
      ).toJSON();

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.UPDATED,
        "Customer Updated",
        uniqueId
      );
      const contentChange = customerContentChanges(customer, updatedCustomer);

      customerLogsPayload = {
        customerId: customer.id,
        logType: CustomerLogType.ACTIVITY,
        action: Actions.UPDATED,
        moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
        contentChange,
        updatedBy: user.id,
      };
    } else {
      customerPayload.updatedBy = user.id;
      customerPayload.createdBy = user.id;
      customer = await customerDbInterface.create(customerPayload);
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "Customer Created",
        uniqueId
      );
      customerLogsPayload = {
        customerId: customer.id,
        logType: CustomerLogType.ACTIVITY,
        action: Actions.CREATED,
        moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
        updatedBy: user.id,
      };
    }

    //Customer Log
    await customerLogsDbInterface.create(customerLogsPayload);

    const invoicePayload: OutletInvoice = {
      id: getGuid(),
      customerId: customer.id,
      outletId: customerBooking.outletId,
      noOfPerson: customerBooking.noOfPerson,
      noOfAdult: customerBooking.noOfAdult,
      noOfChild: customerBooking.noOfChild,
      bookingDate: customerBooking.bookingStartTime,
      bookingStartTime: customerBooking.bookingStartTime,
      bookingEndTime: customerBooking.bookingEndTime,
      bookingType: customerBooking.bookingType,
      mealType: customerBooking.mealType,
      occasion: customerBooking.occasion,
      image: customerBooking.image,
      seatingPreference: customerBooking.seatingPreference,
      specialRequest: customerBooking.specialRequest,
      reservationNotes: customerBooking.notes,
      promocode: customerBooking.promocode,
      source: BookingSource.MANUAL,
      status: BookingStatus.BOOKED,
      createdBy: customerBooking.user?.id,
      updatedBy: customerBooking.user?.id,
    };

    const invoice = await outletInvoiceDbInterface.createee(invoicePayload);
    Log.writeLog(
      Loglevel.INFO,
      "CustomerBooking",
      Actions.CREATED,
      "Invoice Created",
      uniqueId
    );

    //Create TableBooking
    const outletTableBookingPayload: OutletTableBookingPayload = {
      outletInvoice: invoice,
      outletTable: customerBooking.outletTable,
    };

    const tableBooking = await outletTableBookingDbInterface.createee(
      outletTableBookingPayload,
      customerBooking.outletId,
      customerBooking.bookingStartTime,
      customerBooking.bookingEndTime,
      BookingStatus.BOOKED
    );
    Log.writeLog(
      Loglevel.INFO,
      "CustomerBooking",
      Actions.CREATED,
      "TableBooking Created",
      uniqueId
    );

    //save last transaction date in customer
    if (customer) {
      customer.lastTransactionDate = invoice.createdAt;
      await customer?.save();
    }

    const outletTableDbInterface = new OutletTableDbInterface(sequelize);
    const outletTable = await outletTableDbInterface.getTableForInvoice(
      customerBooking.outletTable[0].id,
      tableBooking[0].bookingStartTime,
      tableBooking[0].bookingEndTime
    );

    const getInvoice = await outletInvoiceDbInterface.getInvoiceById(
      invoice.id
    );
    Log.writeLog(
      Loglevel.INFO,
      "CustomerBooking",
      Actions.GET,
      "Invoice Found",
      uniqueId
    );

    //caculate and update averageSpend in customer
    await customerAverageSpend(customer.id, sequelize);

    //send mail
    let templateType = EmailTemplateTypes.BOOKED;

    if (getInvoice.totalAmount > 0) {
      templateType = EmailTemplateTypes.BOOKED_PAYMENT;
    }

    const emailTemplateDbInterface = new EmailTemplateDbInterface(sequelize);

    const emailTemplates =
      await emailTemplateDbInterface.getEmailTemplateByNameAndOutletId(
        customerBooking.outletId,
        templateType
      );

    if (emailTemplates && customerBooking.outlet.Company?.mailChimpPrivateKey) {
      const body = await replaceHtml(
        getInvoice.Outlet as OutletDbModel,
        getInvoice,
        emailTemplates.body,
        sequelize
      );

      await sendMail(
        customer.email,
        body,
        sequelize,
        uniqueId,
        EmailActionType.RESERVATION_MAIL,
        customerBooking.outlet,
        emailTemplates.subject,
        getInvoice.id,
        `${customer.name} ${customer.lastName}`,
        customerBooking.outlet.Company?.mailChimpUserName,
        customerBooking.outlet.Company.mailChimpPrivateKey
      );
    }

    //Log Entry
    const log: SystemLog = {
      type: LogTypes.NEW_RESERVATION,
      action: getInvoice.bookingType,
      module: " ",
      identifier: customer.email ? customer.email : customer.name,
      name: customer.name,
      guid: getGuid(),
      outletId: customerBooking.outlet.id,
      updatedBy: customerBooking.user ? customerBooking.user.id : user.id,
      status: LogStatus.SUCCESS,
      outletInvoiceId: getInvoice.id,
      callerId: getGuid(),
    };

    let systemLogDbInterface = new SystemLogDbInterface(sequelize);

    await systemLogDbInterface.create(log);

    return outletTable;
  } catch (error) {
    throw error;
  }
};

export const CustomerBookingForTicketing = async (
  customerBooking: CustomerBookingTicketPayload,
  bookTicketPayload: BookTicketPayload,
  sequelize: Sequelize,
  uniqueId: string,
  checkPayment: boolean = true
): Promise<OutletInvoiceDbModel | PaymentDbModel> => {
  let user = await getAdminUser(sequelize);
  try {
    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const outletTableBookingDbInterface = new OutletTableBookingDbInterface(
      sequelize
    );

    const paymentDbInterface = new PaymentDbInterface(sequelize);

    let customerPayload: Customer = {
      name: customerBooking.name,
      lastName: customerBooking.lastName,
      email: customerBooking.email,
      mobileNo: customerBooking.mobileNo,
      outletId: customerBooking.outletId,
      salutation: customerBooking.salutation,
      isOPT: customerBooking.isOPT,
    };

    if (customerBooking.customerCompanyName) {
      customerPayload.customerCompanyName = customerBooking.customerCompanyName;
    }

    let customer = await createOrUpdateCustomer(
      customerPayload,
      user,
      sequelize,
      uniqueId
    );

    let totalAmount =
      customerBooking.ticketing.amount * customerBooking.noOfPerson;

    if (
      totalAmount > 0 &&
      customerBooking.ticketing.prePayment === true &&
      checkPayment
    ) {
      if (!customer.stripeId) {
        customer = await creatStripeCustomer(customer, uniqueId);
      }

      //create a checkout session via stripe
      const stripeCheckout: Stripe.Response<Stripe.Checkout.Session> | any =
        await creatStripeCheckoutSession(customer, uniqueId);

      const paymentPayload: Payment = {
        sessionId: stripeCheckout.id,
        customerId: customer.id,
        outletId: customerBooking.outlet.id,
        request: JSON.stringify(bookTicketPayload),
        client_secret: stripeCheckout.client_secret,
        sessionResponse: JSON.stringify(stripeCheckout),
        is_Event: true,
        ticketingId: customerBooking.ticketing.id,
      };

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        "paymentPayload",
        paymentPayload,
        uniqueId
      );

      const creatPayment = await paymentDbInterface.create(paymentPayload);
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        "creatPayment",
        creatPayment,
        uniqueId
      );

      return creatPayment;
    }

    customerBooking.dietaryRestriction = JSON.stringify(
      customerBooking.dietaryRestriction
    );

    const invoicePayload: OutletInvoice = {
      id: getGuid(),
      customerId: customer.id,
      outletId: customerBooking.outletId,
      noOfAdult: customerBooking.noOfAdult,
      noOfChild: customerBooking.noOfChild,
      noOfPerson: customerBooking.noOfPerson,
      bookingDate: customerBooking.bookingStartTime,
      bookingStartTime: customerBooking.bookingStartTime,
      bookingEndTime: customerBooking.bookingEndTime,
      bookingType: customerBooking.bookingType,
      dietaryRestriction: customerBooking.dietaryRestriction,
      occasion: customerBooking.occasion,
      specialRequest: customerBooking.specialRequest,
      mealType: customerBooking.mealType,
      ticketingId: customerBooking.ticketing.id,
      source: BookingSource.WEB,
      status: BookingStatus.BOOKED,
      totalAmount,
    };

    let invoice: OutletInvoiceDbModel | null = null;

    await sequelize.transaction(async (transaction) => {
      invoice = await outletInvoiceDbInterface.create(
        invoicePayload,
        transaction
      );

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "Invoice Created",
        uniqueId
      );

      //Create TableBooking
      const outletTableBookingPayload: OutletTableBookingPayload = {
        outletInvoice: invoice,
        outletTable: customerBooking.outletTable,
      };

      const tableBooking = await outletTableBookingDbInterface.create(
        outletTableBookingPayload,
        customerBooking.outletId,
        customerBooking.bookingStartTime,
        customerBooking.bookingEndTime,
        BookingStatus.BOOKED,
        transaction
      );
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBooking",
        Actions.CREATED,
        "TableBooking Created",
        uniqueId
      );

      //save last transaction date in customer
      if (customer) {
        customer.lastTransactionDate = invoice.createdAt;
        await customer?.save();
      }
    });

    if (!invoice) {
      throw new ApiError({
        message: Exceptions.INVALID_INVOICE,
        statusCode: StatusCode.NOTFOUND,
      });
    }

    invoice = invoice as OutletInvoiceDbModel;
    await invoice.save();
    const getInvoice = await outletInvoiceDbInterface.getInvoiceById(
      invoice.id
    );

    //caculate and update averageSpend in customer
    await customerAverageSpend(customer.id, sequelize);

    //send mail
    //send mail
    let templateType = EmailTemplateTypes.BOOKED;

    if (getInvoice.totalAmount > 0) {
      templateType = EmailTemplateTypes.BOOKED_PAYMENT;
    }

    const emailTemplateDbInterface = new EmailTemplateDbInterface(sequelize);
    const emailTemplates =
      await emailTemplateDbInterface.getEmailTemplateByNameAndOutletId(
        customerBooking.outletId,
        EmailTemplateTypes.BOOKED
      );

    if (emailTemplates && customerBooking.outlet.Company?.mailChimpPrivateKey) {
      const body = await replaceHtml(
        getInvoice.Outlet as OutletDbModel,
        getInvoice,
        emailTemplates.body,
        sequelize
      );

      await sendMail(
        customer.email,
        body,
        sequelize,
        uniqueId,
        EmailActionType.RESERVATION_MAIL,
        customerBooking.outlet,
        emailTemplates.subject,
        getInvoice.id,
        `${customer.name} ${customer.lastName}`,
        customerBooking.outlet.Company?.mailChimpUserName,
        customerBooking.outlet.Company.mailChimpPrivateKey
      );
    }

    //Log Entry
    const log: SystemLog = {
      type: LogTypes.NEW_RESERVATION,
      action: getInvoice.bookingType,
      module: " ",
      identifier: customer.email ? customer.email : customer.name,
      name: customer.name,
      guid: getGuid(),
      outletId: customerBooking.outlet.id,
      updatedBy: user.id,
      status: LogStatus.SUCCESS,
      outletInvoiceId: getInvoice.id,
      callerId: getGuid(),
    };

    let systemLogDbInterface = new SystemLogDbInterface(sequelize);

    await systemLogDbInterface.create(log);

    return getInvoice;
  } catch (error) {
    throw error;
  }
};

export const CustomerBookingForChope = async (
  customerBooking: ChopeBookingPayload,
  sequelize: Sequelize,
  uniqueId: string
): Promise<void> => {
  let user = await getAdminUser(sequelize);
  try {
    const customerDbInterface = new CustomerDbInterface(sequelize);
    const outletInvoiceDbInterface = new OutletInvoiceDbInterface(sequelize);
    const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);

    let customerPayload: Customer = {
      name: customerBooking.name,
      lastName: customerBooking.lastName,
      email: customerBooking.email,
      mobileNo: customerBooking.mobileNo,
      outletId: customerBooking.outletId,
      salutation: customerBooking.salutation,
    };

    customerPayload = customerGenderBySalutation(customerPayload);

    if (isEmpty(customerPayload.email)) {
      customerPayload.email = null;
    }

    //Find or Create Customer
    let customer = await customerDbInterface.getCustomerbyEmailAndPhoneNo(
      customerPayload.email,
      customerPayload.mobileNo,
      customerPayload.outletId
    );

    //customerLogsPayload
    let customerLogsPayload: CustomerLogs | null = null;

    if (customer) {
      const updatedCustomer = (
        await customerDbInterface.updateCustomer(
          customer.id,
          user.id,
          customerPayload
        )
      ).toJSON();

      Log.writeLog(
        Loglevel.INFO,
        "CustomerBookingForChope",
        "Customer Updated",
        customer,
        uniqueId
      );
      const contentChange = customerContentChanges(customer, updatedCustomer);

      customerLogsPayload = {
        customerId: customer.id,
        logType: CustomerLogType.ACTIVITY,
        action: Actions.UPDATED,
        moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
        contentChange,
        updatedBy: user.id,
      };
    } else {
      customerPayload.updatedBy = user.id;
      customerPayload.createdBy = user.id;
      customer = await customerDbInterface.create(customerPayload);
      Log.writeLog(
        Loglevel.INFO,
        "CustomerBookingForChope",
        "Customer Created",
        customer,
        uniqueId
      );
      customerLogsPayload = {
        customerId: customer.id,
        logType: CustomerLogType.ACTIVITY,
        action: Actions.CREATED,
        moduleName: CustomerLogPageTitle.CUSTOMER_RESERVATION,
        updatedBy: user.id,
      };
    }

    //Customer Log
    await customerLogsDbInterface.create(customerLogsPayload);

    const invoicePayload: OutletInvoice = {
      id: getGuid(),
      customerId: customer.id,
      outletId: customerBooking.outletId,
      noOfPerson: customerBooking.noOfPerson,
      bookingDate: customerBooking.bookingStartTime,
      bookingStartTime: customerBooking.bookingStartTime,
      bookingEndTime: customerBooking.bookingEndTime,
      bookingType: customerBooking.bookingType,
      mealType: customerBooking.mealType,
      occasion: customerBooking.occasion,
      seatingPreference: customerBooking.seatingPreference,
      specialRequest: customerBooking.specialRequest,
      reservationNotes: customerBooking.notes,
      chopeBookingId: customerBooking.chopeBookingId,
      source: customerBooking.source,
      status: BookingStatus.BOOKED,
      createdBy: user?.id,
      updatedBy: user?.id,
    };

    const invoice = await outletInvoiceDbInterface.createee(invoicePayload);
    Log.writeLog(
      Loglevel.INFO,
      "CustomerBookingForChope",
      "Invoice Created",
      invoice,
      uniqueId
    );

    //save last transaction date in customer
    if (customer) {
      customer.lastTransactionDate = invoice.createdAt;
      await customer?.save();
    }

    //Log Entry
    const log: SystemLog = {
      type: LogTypes.NEW_RESERVATION,
      action: invoice.bookingType,
      module: " ",
      identifier: customer.email ? customer.email : customer.name,
      name: customer.name,
      guid: getGuid(),
      outletId: customerBooking.outlet.id,
      updatedBy: user.id,
      status: LogStatus.SUCCESS,
      outletInvoiceId: invoice.id,
      callerId: getGuid(),
    };

    let systemLogDbInterface = new SystemLogDbInterface(sequelize);

    await systemLogDbInterface.create(log);
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "CustomerBookingForChope",
      "error",
      error,
      uniqueId
    );
    throw error;
  }
};
