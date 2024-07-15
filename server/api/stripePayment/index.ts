import Stripe from "stripe";
import { strip } from "../../config";
import { CustomerDbModel, OutletInvoiceDbModel } from "../../db/models";
import { FrontEndBaseURL, Loglevel, StatusCode } from "../../context";
import { Log } from "../../context/Logs";
import { CardDetails } from "../../@types/customerBooking";
import { Checkout } from "../../db/interface";
import { CheckoutDbInterface } from "../../db-interfaces";
import { Sequelize, Transaction } from "sequelize";
import { ApiError } from "../../@types/apiError";
import { Exceptions } from "../../exception";
const moduleName = "Stripe";

const stripe = new Stripe(strip.secretkey, {
  apiVersion: "2022-11-15",
});

export const creatStripeCustomer = async (
  customer: CustomerDbModel,
  uniqueId: string
): Promise<CustomerDbModel> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCustomer",
      customer,
      uniqueId
    );

    const stripeCustomer = await stripe.customers.create({
      email: customer.email,
      name: customer.name,
    });

    if (stripeCustomer) {
      customer.stripeId = stripeCustomer.id;
      customer.stripeJSON = JSON.stringify(stripeCustomer);
      await customer.save();
    }

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCustomer",
      stripeCustomer,
      uniqueId
    );

    return customer;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "creatStripeCustomer",
      error,
      uniqueId
    );
    throw error;
  }
};

export const creatStripeToken = async (card: CardDetails, uniqueId: string) => {
  try {
    Log.writeLog(Loglevel.INFO, moduleName, "creatStripeToken", card, uniqueId);
    const token = await stripe.tokens.create({ card });
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeToken",
      token,
      uniqueId
    );

    return token;
  } catch (error) {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeToken",
      error,
      uniqueId
    );

    //throw error;
    const e = error as Error;

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const addCardToCustomer = async (
  customer: CustomerDbModel,
  token: any,
  uniqueId: string
) => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "addCardToCustomer",
      customer,
      uniqueId
    );
    const addCard = await stripe.customers.createSource(customer.stripeId, {
      source: token.id,
    });

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "addCardToCustomer",
      addCard,
      uniqueId
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "addCardToCustomer",
      error,
      uniqueId
    );

    const e = error as Error;

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const creatStripeCharge = async (
  customer: CustomerDbModel,
  outletInvoice: OutletInvoiceDbModel,
  sequelize: Sequelize,
  transaction: Transaction,
  uniqueId: string
): Promise<Stripe.Response<Stripe.Charge>> => {
  try {
    const param: any = {
      amount: outletInvoice.totalAmount * 100,
      currency: "sgd",
      description: `${outletInvoice.id}_${customer.id}`,
      customer: customer.stripeId,
    };

    const charge = await stripe.charges.create(param);
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCharge",
      charge,
      uniqueId
    );

    //Throw Error
    if (charge.paid === false || charge.status === "failed") {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: charge.failure_message
          ? charge.failure_message
          : "Payment Failed",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }
    //create checkout
    const checkoutPayload: Checkout = {
      outletInvoiceId: outletInvoice.id,
      transactionId: charge.id,
      stripeResponse: JSON.stringify(charge),
      status: charge.status,
    };

    const checkoutDbInterface = new CheckoutDbInterface(sequelize);
    const checkout = await checkoutDbInterface.create(
      checkoutPayload,
      transaction
    );
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCharge",
      checkout,
      uniqueId
    );

    return charge;
  } catch (error) {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCharge",
      error,
      uniqueId
    );
    //throw error;

    const e = error as Error;

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const createIntents = async (
  customer: CustomerDbModel,
  uniqueId: string
): Promise<Stripe.Response<Stripe.SetupIntent>> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createIntents",
      customer,
      uniqueId
    );
    const setupIntent = await stripe.setupIntents.create({
      customer: customer.stripeId,
    });

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createIntents",
      setupIntent,
      uniqueId
    );

    return setupIntent;
  } catch (error) {
    const e = error as Error;
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "createIntents",
      e.message,
      uniqueId
    );

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const cancelIntents = async (
  outletInvoice: OutletInvoiceDbModel,
  uniqueId: string
): Promise<OutletInvoiceDbModel> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "cancelIntents",
      outletInvoice,
      uniqueId
    );
    const setupIntent = await stripe.paymentMethods.detach(
      outletInvoice.stripePaymentMethodId
    );

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "cancelIntents",
      setupIntent,
      uniqueId
    );

    outletInvoice.isValidSetupIntent = false;
    await outletInvoice.save();

    return outletInvoice;
  } catch (error) {
    const e = error as Error;
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cancelIntents",
      e.message,
      uniqueId
    );

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const creatStripePaymentMethod = async (
  cardDetails: CardDetails,
  uniqueId: string
): Promise<Stripe.Response<Stripe.PaymentMethod>> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripePaymentMethod",
      cardDetails,
      uniqueId
    );

    const paymentMethod = await stripe.paymentMethods.create({
      type: "card",
      card: {
        number: cardDetails.number,
        exp_month: Number(cardDetails.exp_month),
        exp_year: Number(cardDetails.exp_year),
        cvc: cardDetails.cvc,
      },
    });

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripePaymentMethod",
      paymentMethod,
      uniqueId
    );

    return paymentMethod;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "creatStripePaymentMethod",
      error,
      uniqueId
    );

    //throw error;
    const e = error as Error;

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const createPaymentIntents = async (
  outletInvoice: OutletInvoiceDbModel,
  sequelize: Sequelize,
  uniqueId: string
): Promise<OutletInvoiceDbModel> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createPaymentIntents",
      outletInvoice,
      uniqueId
    );

    const param: any = {
      amount: outletInvoice.totalAmount * 100,
      currency: "sgd",
      description: `${outletInvoice.id}_${outletInvoice.Customer?.id}`,
      customer: outletInvoice.Customer?.stripeId,
      payment_method: outletInvoice.stripePaymentMethodId,
      off_session: false,
      confirm: true,
    };

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createPaymentIntents",
      param,
      uniqueId
    );

    const paymentIntent = await stripe.paymentIntents.create(param);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "createPaymentIntents",
      paymentIntent,
      uniqueId
    );

    if (paymentIntent.status != "succeeded") {
      throw new ApiError({
        message: Exceptions.CUSTOM_ERROR,
        devMessage: paymentIntent.status
          ? paymentIntent.status
          : "Payment Failed",
        statusCode: StatusCode.BAD_REQUEST,
      });
    }

    outletInvoice.totalPaidAmount += paymentIntent.amount_received / 100;
    await outletInvoice.save();

    outletInvoice = await cancelIntents(outletInvoice, uniqueId);

    //create checkout
    const checkoutPayload: Checkout = {
      outletInvoiceId: outletInvoice.id,
      transactionId: paymentIntent.id,
      stripeResponse: JSON.stringify(paymentIntent),
      status: paymentIntent.status,
    };

    const checkoutDbInterface = new CheckoutDbInterface(sequelize);

    let checkout;

    await sequelize.transaction(async (transaction) => {
      checkout = await checkoutDbInterface.create(checkoutPayload, transaction);
    });

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCharge",
      checkout,
      uniqueId
    );

    return outletInvoice;
  } catch (error) {
    const e = error as Error;
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "createPaymentIntents",
      e.message,
      uniqueId
    );

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const creatStripeCheckoutSession = async (
  customer: CustomerDbModel,
  uniqueId: string
): Promise<Stripe.Response<Stripe.Checkout.Session>> => {
  try {
    const param: any = {
      payment_method_types: ["card"],
      currency: "sgd",
      mode: "setup",
      customer: customer.stripeId,
      ui_mode: "embedded",
      return_url: `${FrontEndBaseURL}/Checkout/{CHECKOUT_SESSION_ID}/6000`,
    };

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCheckoutSession",
      param,
      uniqueId
    );

    const session = await stripe.checkout.sessions.create(param);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCheckoutSession",
      session,
      uniqueId
    );

    return session;
  } catch (error) {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "creatStripeCheckoutSession",
      error,
      uniqueId
    );

    const e = error as Error;

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const getStripeCheckoutSession = async (
  sessionId: string,
  uniqueId: string
): Promise<Stripe.Response<Stripe.Checkout.Session>> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getStripeCheckoutSession",
      sessionId,
      uniqueId
    );
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getStripeCheckoutSession",
      session,
      uniqueId
    );

    return session;
  } catch (error) {
    const e = error as Error;
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "getStripeCheckoutSession",
      e.message,
      uniqueId
    );

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};

export const getStripeSetupIntent = async (
  setupIntentId: string,
  uniqueId: string
): Promise<Stripe.Response<Stripe.SetupIntent>> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getStripePaymentIntent",
      setupIntentId,
      uniqueId
    );
    const setupIntent = await stripe.setupIntents.retrieve(setupIntentId);

    Log.writeLog(
      Loglevel.INFO,
      moduleName,
      "getStripePaymentIntent",
      setupIntent,
      uniqueId
    );

    return setupIntent;
  } catch (error) {
    const e = error as Error;
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "getStripePaymentIntent",
      e.message,
      uniqueId
    );

    throw new ApiError({
      message: Exceptions.CUSTOM_ERROR,
      devMessage: e.message,
      statusCode: StatusCode.BAD_REQUEST,
    });
  }
};
