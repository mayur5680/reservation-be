let cron = require("node-cron");
import Imap from "node-imap";
import { Op, Sequelize } from "sequelize";
import { getGuid, sendMail, sendSMS } from "../../context/service";
import {
  Actions,
  BookingSource,
  BookingStatus,
  CronJobTimeZone,
  CustomerLogType,
  CustomerLogTypePurpose,
  EmailActionType,
  EmailTemplateTypes,
  Loglevel,
} from "../../context";
import {
  VerificationDbModel,
  OutletInvoiceDbModel,
  CustomerDbModel,
  OutletDbModel,
  EmailTemplateDbModel,
  CompanyDbModel,
  SMSTemplateDbModel,
  AutoTaggingDbModel,
  TagDbModel,
  TagCategoryDbModel,
} from "../../db/models";
import { replaceHtml } from "../shared/emailTemplate";
import { Log } from "../../context/Logs";
import {
  CompanyDbInterface,
  CustomerLogsDbInterface,
} from "../../db-interfaces";
import { CustomerLogs } from "../../db/interface";
import { CriteriaPayload } from "../../@types/marketing";
import {
  customerAutoTagCriteria,
  getAdminUser,
  linkVoiceCallToIvrs,
  saveIvrsVoiceCall,
} from "../shared";
import { readMail } from "../vendor";
let moment = require("moment-timezone");
import { exec } from "child_process";

const moduleName = "CronJob";

export const cronJobForDltVerfication = () => {
  let uniqueId = getGuid();
  try {
    cron.schedule(
      "0 8 * * *",
      async () => {
        uniqueId = getGuid();
        try {
          let now = new Date();
          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForDltVerfication",
            now,
            uniqueId
          );

          await VerificationDbModel.destroy({
            where: {
              expiredAt: {
                [Op.lt]: now,
              },
            },
            force: true,
          });

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForDltVerfication",
            "Verification Code Deleted",
            uniqueId
          );
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForDltVerfication",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cronJobForDltVerfication",
      error,
      uniqueId
    );
  }
};

export const cronJobForEmailSending = () => {
  let uniqueId = getGuid();
  try {
    cron.schedule(
      "0 17 * * *",
      async () => {
        uniqueId = getGuid();
        try {
          let now = new Date();
          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForEmailSending",
            now,
            uniqueId
          );

          const startTime = moment().add(3, "days").startOf("day");
          const endTime = moment(startTime).endOf("day");

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForEmailSending",
            { startTime, endTime },
            uniqueId
          );

          const NormalDateStartDateTime = new Date(startTime);
          const NormalDateEndDateTime = new Date(endTime);

          let query: any = {
            status: {
              [Op.like]: BookingStatus.BOOKED,
            },
            source: {
              [Op.and]: [
                {
                  [Op.notLike]: BookingSource.CHOPE,
                },
                {
                  [Op.notLike]: BookingSource.ODDLE,
                },
              ],
            },
            [Op.and]: [
              {
                bookingStartTime: {
                  [Op.gte]: NormalDateStartDateTime,
                },
              },
              {
                bookingStartTime: {
                  [Op.lte]: NormalDateEndDateTime,
                },
              },
            ],
          };

          const invoices = await OutletInvoiceDbModel.findAll({
            where: query,
            include: [
              {
                model: CustomerDbModel,
                paranoid: false,
                required: true,
              },
              {
                model: OutletDbModel,
                paranoid: false,
                required: true,
                include: [
                  {
                    model: CompanyDbModel,
                    paranoid: false,
                    required: true,
                  },
                ],
              },
            ],
          });

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForEmailSending",
            invoices,
            uniqueId
          );

          const emailTemplates = await EmailTemplateDbModel.findAll({
            where: {
              templateType: EmailTemplateTypes.CONFIRMED,
              isActive: true,
            },
          });

          if (invoices.length > 0) {
            await Promise.all(
              invoices.map(async (invoice) => {
                const emailTemplate = emailTemplates.find(
                  (template) => template.outletId == invoice.outletId
                );

                Log.writeLog(
                  Loglevel.INFO,
                  moduleName,
                  "cronJobForEmailSending",
                  emailTemplates,
                  uniqueId
                );

                if (
                  emailTemplate &&
                  invoice.Customer &&
                  invoice.Outlet &&
                  invoice.Outlet?.Company?.mailChimpPrivateKey &&
                  OutletInvoiceDbModel.sequelize
                ) {
                  const body = await replaceHtml(
                    invoice.Outlet as OutletDbModel,
                    invoice,
                    emailTemplate.body,
                    OutletInvoiceDbModel.sequelize
                  );
                  await sendMail(
                    invoice.Customer?.email,
                    body,
                    OutletInvoiceDbModel.sequelize,
                    uniqueId,
                    EmailActionType.CONFIRMATION_RESERVATION,
                    invoice.Outlet,
                    emailTemplate.subject,
                    invoice.id,
                    `${invoice.Customer?.name} ${invoice.Customer?.lastName}`,
                    invoice.Outlet?.Company?.mailChimpUserName,
                    invoice.Outlet.Company.mailChimpPrivateKey
                  );
                }
              })
            );
          }
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForEmailSending",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cronJobForEmailSending",
      error,
      uniqueId
    );
  }
};

export const cronJobForSMSSending = async () => {
  let uniqueId = getGuid();
  try {
    cron.schedule(
      "30 17 * * *",
      async () => {
        uniqueId = getGuid();
        try {
          const currentTime = moment().tz("Asia/Singapore");
          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForSMSSending",
            currentTime,
            uniqueId
          );

          //SMS Sending to customer whoes booking is after 1 day
          const startTimeSMS = moment().add(1, "days").startOf("day");
          const SMSendTimeSMS = moment(startTimeSMS).endOf("day");

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "SMS Sending",
            { startTimeSMS, SMSendTimeSMS },
            uniqueId
          );
          const NormalStartDateTime = new Date(startTimeSMS);
          const NormalEndDateTime = new Date(SMSendTimeSMS);

          let querySMS: any = {
            status: {
              [Op.like]: BookingStatus.BOOKED,
            },
            source: {
              [Op.and]: [
                {
                  [Op.notLike]: BookingSource.CHOPE,
                },
                {
                  [Op.notLike]: BookingSource.ODDLE,
                },
              ],
            },
            [Op.and]: [
              {
                bookingStartTime: {
                  [Op.gte]: NormalStartDateTime,
                },
              },
              {
                bookingStartTime: {
                  [Op.lte]: NormalEndDateTime,
                },
              },
            ],
          };

          const invoicesForSMS = await OutletInvoiceDbModel.findAll({
            where: querySMS,
            include: [
              {
                model: CustomerDbModel,
                paranoid: false,
                required: true,
              },
              {
                model: OutletDbModel,
                paranoid: false,
                required: true,
                include: [
                  {
                    model: CompanyDbModel,
                    paranoid: false,
                    required: true,
                  },
                ],
              },
            ],
          });

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForSMSSending",
            invoicesForSMS,
            uniqueId
          );

          const smsTemplates = await SMSTemplateDbModel.findAll({
            where: {
              templateType: BookingStatus.CONFIRMED,
              isActive: true,
            },
          });

          if (invoicesForSMS.length > 0) {
            await Promise.all(
              invoicesForSMS.map(async (invoice) => {
                const smsTemplate = smsTemplates.find(
                  (template) => template.outletId == invoice.outletId
                );

                Log.writeLog(
                  Loglevel.INFO,
                  moduleName,
                  "cronJobForSMSSending",
                  smsTemplate,
                  uniqueId
                );

                if (
                  smsTemplate &&
                  invoice.Customer &&
                  invoice.Outlet &&
                  invoice.Outlet.Company &&
                  OutletInvoiceDbModel.sequelize
                ) {
                  const body = await replaceHtml(
                    invoice.Outlet as OutletDbModel,
                    invoice,
                    smsTemplate.body,
                    OutletInvoiceDbModel.sequelize,
                    false
                  );

                  await sendSMS(
                    invoice.Customer?.mobileNo,
                    body,
                    invoice.Outlet.Company,
                    OutletInvoiceDbModel.sequelize,
                    uniqueId
                  );
                  const customerLogsDbInterface = new CustomerLogsDbInterface(
                    OutletInvoiceDbModel.sequelize
                  );

                  let user = await getAdminUser(OutletInvoiceDbModel.sequelize);

                  //Customer Logs
                  const customerLogsPayload: CustomerLogs = {
                    customerId: invoice.customerId,
                    logType: CustomerLogType.SMS,
                    purpose: CustomerLogTypePurpose.CONFIRMATION,
                    outletInvoiceId: invoice.id,
                    updatedBy: user.id,
                  };

                  await customerLogsDbInterface.create(customerLogsPayload);
                }
              })
            );
          }
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForSMSSending11",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cronJobForSMSSending",
      error,
      uniqueId
    );
  }
};

export const cronJobForAutoTagging = () => {
  let uniqueId = getGuid();
  try {
    cron.schedule(
      "*/30 * * * *",
      async () => {
        uniqueId = getGuid();
        try {
          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForAutoTagging",
            "Start",
            uniqueId
          );
          const autoTags = await AutoTaggingDbModel.findAll({
            where: {
              isActive: true,
            },
            include: [
              {
                model: TagDbModel,
                where: { isActive: true },
                required: true,
                include: [
                  {
                    model: TagCategoryDbModel,
                    where: { isActive: true },
                    required: true,
                  },
                ],
              },
              {
                model: OutletDbModel,
                where: { isActive: true },
                required: true,
              },
            ],
          });

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForAutoTagging",
            autoTags,
            uniqueId
          );

          await Promise.all(
            autoTags.map(async (autoTag) => {
              const filterAutoTag = {
                ...autoTag,
                criteria: JSON.parse(autoTag.criteria),
              };

              const criteriaPayload: CriteriaPayload[] = filterAutoTag.criteria;

              const customers = await customerAutoTagCriteria(
                criteriaPayload,
                autoTag.Outlet as OutletDbModel,
                uniqueId,
                AutoTaggingDbModel.sequelize as Sequelize
              );

              await Promise.all(
                customers.map(async (customer) => {
                  Log.writeLog(
                    Loglevel.INFO,
                    moduleName,
                    "Before Customer",
                    customer,
                    uniqueId
                  );

                  let tags = customer.tags ? JSON.parse(customer.tags) : [];

                  const filterData = tags.find(
                    (tag: any) => tag.id === autoTag.tagId
                  );

                  if (!filterData) {
                    tags.push({
                      id: autoTag.Tag?.id,
                      name: autoTag.Tag?.name,
                    });

                    customer.tags = JSON.stringify(tags);
                    await customer.save();

                    Log.writeLog(
                      Loglevel.INFO,
                      moduleName,
                      "After Customer",
                      customer,
                      uniqueId
                    );
                  }
                })
              );
            })
          );
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForAutoTagging",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cronJobForAutoTagging",
      error,
      uniqueId
    );
  }
};

export const cronJobForReadMailChope = () => {
  try {
    const imap = new Imap({
      user: "testing@createries.com",
      password: "Creative159552",
      host: "mail.createries.com",
      port: 143,
      authTimeout: 10000,
      connTimeout: 30000,
      tls: false,
    });

    cron.schedule(
      "*/5 * * * *",
      async () => {
        const uniqueId = getGuid();
        try {
          let now = new Date();
          Log.writeLog(
            Loglevel.INFO,
            "cronJobForReadMailChope",
            Actions.GET,
            now,
            uniqueId
          );

          await readMail(imap, OutletDbModel.sequelize as Sequelize, uniqueId);

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            Actions.GET,
            "cronJobForReadMailChope",
            uniqueId
          );
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForReadMailChope",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cronJobForReadMailChope",
      error,
      "testtt"
    );
  }
};

export const cronJobForIVRS = () => {
  let uniqueId = getGuid();
  try {
    cron.schedule(
      "*/33 * * * *",
      async () => {
        uniqueId = getGuid();
        try {
          let now = new Date();
          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForIVRS",
            now,
            uniqueId
          );

          if (CompanyDbModel.sequelize) {
            const companyDbInterface = new CompanyDbInterface(
              CompanyDbModel.sequelize
            );
            const companies = await companyDbInterface.getAllcompany();

            await Promise.all(
              companies.map(async (company) => {
                if (
                  company.ivrsUserKey &&
                  company.ivrsSecretKey &&
                  CompanyDbModel.sequelize
                ) {
                  //save ivrs voice call
                  await saveIvrsVoiceCall(CompanyDbModel.sequelize, uniqueId);

                  //link ivrs call detials to voiceCalls
                  await linkVoiceCallToIvrs(CompanyDbModel.sequelize, uniqueId);
                }
              })
            );
          }
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForIVRS",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(Loglevel.ERROR, moduleName, "cronJobForIVRS", error, uniqueId);
  }
};

export const cronJobForRestart = () => {
  let uniqueId = getGuid();
  try {
    cron.schedule(
      "0 3 * * *",
      async () => {
        uniqueId = getGuid();
        try {
          const restartCommand = "pm2 restart backend";
          const listCommand = "pm2 list";
          let now = new Date();

          Log.writeLog(
            Loglevel.INFO,
            moduleName,
            "cronJobForRestart",
            now,
            uniqueId
          );

          const restartApp = () => {
            exec(restartCommand, (err, stdout, stderr) => {
              if (!err && !stderr) {
                Log.writeLog(
                  Loglevel.INFO,
                  moduleName,
                  "cronJobForRestart",
                  "App restarted!!!",
                  uniqueId
                );

                listApps();
              } else if (err || stderr) {
                Log.writeLog(
                  Loglevel.ERROR,
                  moduleName,
                  "cronJobForRestart",
                  err || stderr,
                  uniqueId
                );
              }
            });
          };

          const listApps = () => {
            exec(listCommand, (err, stdout, stderr) => {
              // handle err if you like!
              Log.writeLog(
                Loglevel.ERROR,
                moduleName,
                "pm2 list",
                stdout,
                uniqueId
              );
            });
          };

          restartApp();
        } catch (error) {
          Log.writeLog(
            Loglevel.ERROR,
            moduleName,
            "cronJobForRestart",
            error,
            uniqueId
          );
        }
      },
      {
        timezone: CronJobTimeZone,
      }
    );
  } catch (error) {
    Log.writeLog(
      Loglevel.ERROR,
      moduleName,
      "cronJobForRestart",
      error,
      uniqueId
    );
  }
};
