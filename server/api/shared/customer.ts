import { Model, Sequelize } from "sequelize";
import {
  Actions,
  BookingStatus,
  CustomerGender,
  CustomerLogPageTitle,
  CustomerLogType,
  CustomerSalutation,
  Loglevel,
} from "../../context";
import {
  CompanyDbInterface,
  CustomerDbInterface,
  CustomerLogsDbInterface,
} from "../../db-interfaces";
import {
  CustomerDbModel,
  OutletDbModel,
  OutletInvoiceDbModel,
  UserDbModel,
} from "../../db/models";
import {
  CriteriaPayload,
  CriteriaValue,
  CustomerPayload,
} from "../../@types/marketing";
import { Log } from "../../context/Logs";
import {
  CustomerContentChanges,
  NoShowAndCancelation,
} from "../../@types/customer";
import { Customer, CustomerLogs } from "../../db/interface";
let moment = require("moment-timezone");

export const customerChurnRisk = async (
  customerId: number,
  sequelize: Sequelize
): Promise<Number> => {
  const customerDbInterface = new CustomerDbInterface(sequelize);
  const getCustomer = (
    await customerDbInterface.getCustomerChurnRiskById(customerId)
  ).toJSON();

  let count = 0;

  if (getCustomer.OutletInvoice) {
    await Promise.all(
      getCustomer.OutletInvoice.map((invoice: OutletInvoiceDbModel) => {
        if (
          invoice.status === BookingStatus.CANCELLED ||
          invoice.status === BookingStatus.NOSHOW
        ) {
          count++;
        }
      })
    );
  }

  const churnRisk = (count / getCustomer.OutletInvoice.length) * 100;

  return churnRisk ? churnRisk : 0;
};

export const customerAverageSpend = async (
  customerId: number,
  sequelize: Sequelize
): Promise<void> => {
  try {
    const customerDbInterface = new CustomerDbInterface(sequelize);
    const getCustomer = await customerDbInterface.getCustomerAverageSpend(
      customerId
    );

    let count = 0;
    let totalAmount = 0;

    if (getCustomer.OutletInvoice) {
      getCustomer.OutletInvoice.map((invoice) => {
        totalAmount += invoice.totalAmount;
        count++;
      });

      const averageSpend = totalAmount / count;

      getCustomer.averageSpend = averageSpend;
      await getCustomer.save();
    }
  } catch (error) {
    throw error;
  }
};

export const customerMarketingCriteria = async (
  criteriaPayload: CriteriaPayload[],
  uniqueId: string,
  sequelize: Sequelize
) => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "customerMarketingCriteria",
      "criteriaPayload",
      criteriaPayload,
      uniqueId
    );

    //query in OutletInvoice
    let count = 0;

    let outletIds: number[] = [];

    if (criteriaPayload.length > 0) {
      await Promise.all(
        criteriaPayload.map(async (criteria) => {
          if (criteria.fieldName === "companyId") {
            const companyId = Number(criteria.value);
            const companyDbInterface = new CompanyDbInterface(sequelize);
            const company = await companyDbInterface.getComapnyById(
              companyId,
              false
            );
            Log.writeLog(
              Loglevel.INFO,
              "customerMarketingCriteria",
              "syncDataToMailChimp",
              "Company Found",
              uniqueId
            );

            if (company.Outlet && company.Outlet.length > 0) {
              company.Outlet.map((outlet) => outletIds.push(outlet.id));
            }
          }
        })
      );
    }

    let invoiceQuery = `SELECT DISTINCT "customerId" FROM "OutletInvoice" WHERE `;

    if (outletIds.length > 0) {
      invoiceQuery += ` "outletId" in (${outletIds}) AND`;
    }

    if (criteriaPayload && criteriaPayload.length > 0) {
      criteriaPayload.map((criteria) => {
        if (
          criteria.fieldName === "status" ||
          criteria.fieldName === "mealType" ||
          criteria.fieldName === "bookingType" ||
          criteria.fieldName === "dinningOptions" ||
          criteria.fieldName === "preOrder" ||
          criteria.fieldName === "isPrivateTableBooked" ||
          criteria.fieldName === "occasion" ||
          criteria.fieldName === "bookingDate" ||
          criteria.fieldName === "dietaryRestriction" ||
          criteria.fieldName === "occasionDate"
        ) {
          if (count !== 0) {
            invoiceQuery += "AND ";
          }
          if (
            criteria.fieldName === "dinningOptions" ||
            criteria.fieldName === "dietaryRestriction"
          ) {
            invoiceQuery += `"${criteria.fieldName}" ${criteria.criteria} '%${criteria.value}%' `;
          } else if (criteria.fieldName === "preOrder") {
            invoiceQuery += `"basket" ${criteria.criteria} '%${criteria.value}%' `;
          } else if (criteria.fieldName === "bookingDate") {
            if (criteria.criteria === "BETWEEN") {
              const criteriaValue = criteria.value as CriteriaValue;

              const value1 = moment(criteriaValue.value1, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const value2 = moment(criteriaValue.value2, "DD-MM-YYYY")
                .endOf("day")
                .format();
              invoiceQuery += `"${criteria.fieldName}" ${criteria.criteria} '${value1}' AND '${value2}' `;
            } else {
              const formatedStartDate = moment(criteria.value, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const formatedEndDate = moment(criteria.value, "DD-MM-YYYY")
                .endOf("day")
                .format();

              invoiceQuery += `"${criteria.fieldName}" Between '${formatedStartDate}' AND '${formatedEndDate}'`;
            }
          } else if (criteria.fieldName === "occasionDate") {
            if (criteria.criteria !== "BETWEEN") {
              invoiceQuery += `EXTRACT('MONTH' from "bookingDate" )${
                criteria.criteria
              } ${Number(criteria.value)} `;
            } else {
              const criteriaValue = criteria.value as CriteriaValue;
              invoiceQuery += `EXTRACT('MONTH' from "bookingDate" ) >= ${Number(
                criteriaValue.value1
              )} AND EXTRACT('MONTH' from "bookingDate") <= ${Number(
                criteriaValue.value2
              )}`;
            }
          } else {
            invoiceQuery += `"${criteria.fieldName}" ${criteria.criteria} '${criteria.value}' `;
          }
          count++;
        }
      });
    }

    let invoices: Model<any, any>[] = [];

    if (count > 0) {
      invoices = await sequelize.query(invoiceQuery, {
        model: sequelize.models.OutletInvoiceDbModel,
        mapToModel: true,
      });
    }

    let customerIds = null;
    if (invoices && invoices.length > 0) {
      customerIds = invoices.map((invoice: any) => {
        return invoice.customerId;
      });
    }

    //query in Customer
    let queryCount = 0;
    let query = `SELECT "Customer".*, "Outlet"."name" as "outletName" FROM "Customer" LEFT JOIN "Outlet" on "Customer"."outletId" = "Outlet"."id" WHERE "isOPT" = true AND `;

    if (outletIds.length > 0) {
      invoiceQuery += ` "outletId" in (${outletIds}) AND`;
    }

    if (criteriaPayload && criteriaPayload.length > 0) {
      criteriaPayload.map((criteria) => {
        if (
          !(
            criteria.fieldName === "status" ||
            criteria.fieldName === "mealType" ||
            criteria.fieldName === "bookingType" ||
            criteria.fieldName === "dinningOptions" ||
            criteria.fieldName === "preOrder" ||
            criteria.fieldName === "isPrivateTableBooked" ||
            criteria.fieldName === "occasion" ||
            criteria.fieldName === "bookingDate" ||
            criteria.fieldName === "dietaryRestriction" ||
            criteria.fieldName === "companyId" ||
            criteria.fieldName === "occasionDate"
          )
        ) {
          if (queryCount !== 0) {
            query += "AND ";
          }
          if (
            criteria.fieldName === "createdAt" ||
            criteria.fieldName === "lastTransactionDate"
          ) {
            if (criteria.criteria === "BETWEEN") {
              const criteriaValue = criteria.value as CriteriaValue;

              const value1 = moment(criteriaValue.value1, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const value2 = moment(criteriaValue.value2, "DD-MM-YYYY")
                .endOf("day")
                .format();
              query += `"${criteria.fieldName}" ${criteria.criteria} '${value1}' AND '${value2}' `;
              queryCount++;
            } else {
              const formatedStartDate = moment(criteria.value, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const formatedEndDate = moment(criteria.value, "DD-MM-YYYY")
                .endOf("day")
                .format();

              query += `"${criteria.fieldName}" Between '${formatedStartDate}' AND '${formatedEndDate}'`;
              queryCount++;
            }
          } else if (criteria.fieldName === "outletId") {
            const outletId = Number(criteria.value);
            query += `"${criteria.fieldName}" ${criteria.criteria} ${outletId} `;
            queryCount++;
          } else if (criteria.fieldName === "dob") {
            if (criteria.criteria !== "BETWEEN") {
              query += `EXTRACT('MONTH' from ${criteria.fieldName} )${
                criteria.criteria
              } ${Number(criteria.value)} `;
              queryCount++;
            } else {
              const criteriaValue = criteria.value as CriteriaValue;
              query += `EXTRACT('MONTH' from ${
                criteria.fieldName
              } ) >= ${Number(criteriaValue.value1)} AND EXTRACT('MONTH' from ${
                criteria.fieldName
              }) <= ${Number(criteriaValue.value2)}`;
              queryCount++;
            }
          } else {
            query += `"${criteria.fieldName}" ${criteria.criteria} '${criteria.value}' `;
            queryCount++;
          }
        }
      });
    }

    if (customerIds && customerIds.length > 0) {
      if (queryCount > 0) {
        query += `AND "Customer"."id" in (${customerIds})`;
      } else {
        query += `"Customer"."id" in (${customerIds})`;
      }
    }

    if (!customerIds && queryCount === 0) {
      return [];
    }

    Log.writeLog(
      Loglevel.INFO,
      "customerMarketingCriteria",
      "query",
      query,
      uniqueId
    );

    let data = await sequelize.query(query, {
      model: sequelize.models.CustomerDbModel,
      mapToModel: true,
    });

    const result = JSON.parse(
      JSON.stringify(data)
    ) as unknown as CustomerPayload[];

    Log.writeLog(
      Loglevel.INFO,
      "customerMarketingCriteria",
      "result",
      result,
      uniqueId
    );

    return result;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "customerMarketingCriteria",
      "criteriaPayload",
      error,
      uniqueId
    );

    throw error;
  }
};

export const customerContentChanges = (
  previousCustomer: CustomerDbModel,
  updatedCustomer: any
): string => {
  try {
    let customerContentChanges: CustomerContentChanges[] = [];

    let previousCustomerObject = previousCustomer.toJSON();
    const updatedCustomerObject = updatedCustomer;

    delete previousCustomerObject.Outlet;

    Object.keys(previousCustomerObject).map((field) => {
      if (
        !(
          field === "updatedAt" ||
          field === "updatedBy" ||
          field === "createdAt" ||
          field === "lastTransactionDate"
        )
      ) {
        if (previousCustomerObject[field] !== updatedCustomerObject[field]) {
          customerContentChanges.push({
            filedName: field,
            oldValue: previousCustomerObject[field],
            newValue: updatedCustomerObject[field],
          });
        }
      }
    });

    const contentChange = JSON.stringify(customerContentChanges);

    return contentChange;
  } catch (error) {
    throw error;
  }
};

export const customerAutoTagCriteria = async (
  criteriaPayload: CriteriaPayload[],
  outlet: OutletDbModel,
  uniqueId: string,
  sequelize: Sequelize
) => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "customerAutoTagCriteria",
      "criteriaPayload",
      criteriaPayload,
      uniqueId
    );

    //query in OutletInvoice
    let count = 0;

    let invoiceQuery = `SELECT DISTINCT "customerId" FROM "OutletInvoice" WHERE "outletId" = '${outlet.id}' AND `;

    if (criteriaPayload && criteriaPayload.length > 0) {
      criteriaPayload.map((criteria) => {
        if (
          criteria.fieldName === "status" ||
          criteria.fieldName === "mealType" ||
          criteria.fieldName === "bookingType" ||
          criteria.fieldName === "dinningOptions" ||
          criteria.fieldName === "preOrder" ||
          criteria.fieldName === "isPrivateTableBooked" ||
          criteria.fieldName === "occasion" ||
          criteria.fieldName === "bookingDate" ||
          criteria.fieldName === "dietaryRestriction" ||
          criteria.fieldName === "occasionDate"
        ) {
          if (count !== 0) {
            invoiceQuery += "AND ";
          }
          if (
            criteria.fieldName === "dinningOptions" ||
            criteria.fieldName === "dietaryRestriction"
          ) {
            invoiceQuery += `"${criteria.fieldName}" ${criteria.criteria} '%${criteria.value}%' `;
          } else if (criteria.fieldName === "preOrder") {
            invoiceQuery += `"basket" ${criteria.criteria} '%${criteria.value}%' `;
          } else if (criteria.fieldName === "bookingDate") {
            if (criteria.criteria === "BETWEEN") {
              const criteriaValue = criteria.value as CriteriaValue;

              const value1 = moment(criteriaValue.value1, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const value2 = moment(criteriaValue.value2, "DD-MM-YYYY")
                .endOf("day")
                .format();
              invoiceQuery += `"${criteria.fieldName}" ${criteria.criteria} '${value1}' AND '${value2}' `;
            } else {
              const formatedStartDate = moment(criteria.value, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const formatedEndDate = moment(criteria.value, "DD-MM-YYYY")
                .endOf("day")
                .format();

              invoiceQuery += `"${criteria.fieldName}" Between '${formatedStartDate}' AND '${formatedEndDate}'`;
            }
          } else if (criteria.fieldName === "occasionDate") {
            if (criteria.criteria !== "BETWEEN") {
              invoiceQuery += `EXTRACT('MONTH' from "bookingDate" )${
                criteria.criteria
              } ${Number(criteria.value)} `;
            } else {
              const criteriaValue = criteria.value as CriteriaValue;
              invoiceQuery += `EXTRACT('MONTH' from "bookingDate" ) >= ${Number(
                criteriaValue.value1
              )} AND EXTRACT('MONTH' from "bookingDate") <= ${Number(
                criteriaValue.value2
              )}`;
            }
          } else {
            invoiceQuery += `"${criteria.fieldName}" ${criteria.criteria} '${criteria.value}' `;
          }
          count++;
        }
      });
    }

    let invoices: Model<any, any>[] = [];

    if (count > 0) {
      invoices = await sequelize.query(invoiceQuery, {
        model: sequelize.models.OutletInvoiceDbModel,
        mapToModel: true,
      });
    }

    let customerIds = null;
    if (invoices && invoices.length > 0) {
      customerIds = invoices.map((invoice: any) => {
        return invoice.customerId;
      });
    }

    //query in Customer
    let queryCount = 0;
    let query = `SELECT * FROM "Customer" WHERE "outletId" = '${outlet.id}' AND `;

    if (criteriaPayload && criteriaPayload.length > 0) {
      criteriaPayload.map((criteria) => {
        if (
          !(
            criteria.fieldName === "status" ||
            criteria.fieldName === "mealType" ||
            criteria.fieldName === "bookingType" ||
            criteria.fieldName === "dinningOptions" ||
            criteria.fieldName === "preOrder" ||
            criteria.fieldName === "isPrivateTableBooked" ||
            criteria.fieldName === "occasion" ||
            criteria.fieldName === "bookingDate" ||
            criteria.fieldName === "dietaryRestriction" ||
            criteria.fieldName === "occasionDate"
          )
        ) {
          if (queryCount !== 0) {
            query += "AND ";
          }
          if (
            criteria.fieldName === "createdAt" ||
            criteria.fieldName === "lastTransactionDate"
          ) {
            if (criteria.criteria === "BETWEEN") {
              const criteriaValue = criteria.value as CriteriaValue;

              const value1 = moment(criteriaValue.value1, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const value2 = moment(criteriaValue.value2, "DD-MM-YYYY")
                .endOf("day")
                .format();
              query += `"${criteria.fieldName}" ${criteria.criteria} '${value1}' AND '${value2}' `;
              queryCount++;
            } else {
              const formatedStartDate = moment(criteria.value, "DD-MM-YYYY")
                .startOf("day")
                .format();

              const formatedEndDate = moment(criteria.value, "DD-MM-YYYY")
                .endOf("day")
                .format();

              query += `"${criteria.fieldName}" Between '${formatedStartDate}' AND '${formatedEndDate}'`;
              queryCount++;
            }
          } else if (criteria.fieldName === "dob") {
            if (criteria.criteria !== "BETWEEN") {
              query += `EXTRACT('MONTH' from ${criteria.fieldName} )${
                criteria.criteria
              } ${Number(criteria.value)} `;
              queryCount++;
            } else {
              const criteriaValue = criteria.value as CriteriaValue;
              query += `EXTRACT('MONTH' from ${
                criteria.fieldName
              } ) >= ${Number(criteriaValue.value1)} AND EXTRACT('MONTH' from ${
                criteria.fieldName
              }) <= ${Number(criteriaValue.value2)}`;
              queryCount++;
            }
          } else {
            query += `"${criteria.fieldName}" ${criteria.criteria} '${criteria.value}' `;
            queryCount++;
          }
        }
      });
    }

    if (customerIds && customerIds.length > 0) {
      if (queryCount > 0) {
        query += `AND "Customer"."id" in (${customerIds})`;
      } else {
        query += `"Customer"."id" in (${customerIds})`;
      }
    }

    if (!customerIds && queryCount === 0) {
      return [];
    }

    Log.writeLog(
      Loglevel.INFO,
      "customerAutoTagCriteria",
      "query",
      query,
      uniqueId
    );

    let data = await sequelize.query(query, {
      model: sequelize.models.CustomerDbModel,
      mapToModel: true,
    });

    const result = data as unknown as CustomerDbModel[];

    Log.writeLog(
      Loglevel.INFO,
      "customerAutoTagCriteria",
      "result",
      result,
      uniqueId
    );

    return result;
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      "customerAutoTagCriteria",
      "criteriaPayload",
      error,
      uniqueId
    );
    throw error;
  }
};

export const customerGenderBySalutation = (
  customerPayload: Customer
): Customer => {
  try {
    if (
      customerPayload.salutation === CustomerSalutation.MS ||
      customerPayload.salutation === CustomerSalutation.MISS ||
      customerPayload.salutation === CustomerSalutation.MDM ||
      customerPayload.salutation === CustomerSalutation.MRS
    ) {
      return { ...customerPayload, gender: CustomerGender.FEMALE };
    } else if (customerPayload.salutation === CustomerSalutation.MR) {
      return { ...customerPayload, gender: CustomerGender.MALE };
    }

    return customerPayload;
  } catch (error) {
    throw error;
  }
};

export const calculateNoShowAndCancel = async (
  customer: CustomerDbModel,
  companyId: number,
  sequelize: Sequelize
): Promise<NoShowAndCancelation> => {
  const customerDbInterface = new CustomerDbInterface(sequelize);

  const customers = await customerDbInterface.getAllCustomersInCompanyLevel(
    customer.email,
    customer.mobileNo,
    companyId
  );

  let noShow = 0;
  let cancelation = 0;

  if (customers.length > 0) {
    customers.map((customer) => {
      if (customer.OutletInvoice && customer.OutletInvoice.length > 0) {
        customer.OutletInvoice.map((invoice) => {
          if (invoice.status === BookingStatus.NOSHOW) {
            noShow++;
          } else if (invoice.status === BookingStatus.CANCELLED) {
            cancelation++;
          }
        });
      }
    });
  }

  const noShowAndCancelation: NoShowAndCancelation = {
    noShow,
    cancelation,
  };

  return noShowAndCancelation;
};

export const createOrUpdateCustomer = async (
  customerPayload: Customer,
  user: UserDbModel,
  sequelize: Sequelize,
  uniqueId: string
): Promise<CustomerDbModel> => {
  try {
    Log.writeLog(
      Loglevel.INFO,
      "Customer",
      Actions.GET,
      customerPayload,
      uniqueId
    );
    const customerDbInterface = new CustomerDbInterface(sequelize);
    const customerLogsDbInterface = new CustomerLogsDbInterface(sequelize);
    customerPayload = customerGenderBySalutation(customerPayload);

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
        "Customer",
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
        "Customer",
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

    return customer;
  } catch (error) {
    throw error;
  }
};
