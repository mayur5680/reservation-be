import { addCardToCustomer, creatStripeCharge } from "../stripePayment";
import { CustomerDbModel, OutletInvoiceDbModel } from "../../db/models";
import { Sequelize, Transaction } from "sequelize";
import Stripe from "stripe";

export const payment = async (
  customer: CustomerDbModel,
  outletInvoice: OutletInvoiceDbModel,
  token: any,
  sequelize: Sequelize,
  transaction: Transaction,
  uniqueId: string
): Promise<Stripe.Response<Stripe.Charge>> => {
  await addCardToCustomer(customer, token, uniqueId);
  const charge = await creatStripeCharge(
    customer,
    outletInvoice,
    sequelize,
    transaction,
    uniqueId
  );
  return charge;
};
