/**
 * Import Logging library
 */

 const logLocation = "../logs";
 var log4js = require("log4js");
 log4js.configure({
     appenders: {
         default: {
             type: 'dateFile',
             pattern: 'yyyy-MM-dd',
             filename: `${logLocation}/app.log`
         },
         check_bank_transfer: {
             type: 'dateFile',
             pattern: 'yyyy-MM-dd',
             filename: `${logLocation}/scheduled_job/check_bank_transfer.log`
         },
         update_admin_token: {
             type: 'dateFile',
             pattern: 'yyyy-MM-dd',
             filename: `${logLocation}/scheduled_job/update_admin_token.log`
         },
         check_liquidated_loan: {
            type: 'dateFile',
            pattern: 'yyyy-MM-dd',
            filename: `${logLocation}/scheduled_job/check_liquidated_loan.log`
        },
         check_defaulted_loan: {
             type: 'dateFile',
             pattern: 'yyyy-MM-dd',
             filename: `${logLocation}/scheduled_job/check_defaulted_loan.log`
         },
         event_log_reading: {
             type: 'dateFile',
             pattern: 'yyyy-MM-dd',
             filename: `${logLocation}/scheduled_job/event_log_reading.log`
         }
     },
     categories: {
         default: {
             appenders: ['default'],
             level: 'error'
         },
         check_bank_transfer: {
             appenders: ['check_bank_transfer'],
             level: 'debug'
         },
         update_admin_token: {
             appenders: ['update_admin_token'],
             level: 'debug'
         },
         check_liquidated_loan: {
             appenders: ['check_liquidated_loan'],
             level: 'debug'
         },
         check_defaulted_loan: {
             appenders: ['check_defaulted_loan'],
             level: 'debug'
         },
         event_log_reading: {
             appenders: ['event_log_reading'],
             level: 'debug'
         }
     }
 });
 
 module.exports = {
     default: log4js.getLogger('default'),
     check_bank_transfer: log4js.getLogger('check_bank_transfer'),
     update_admin_token: log4js.getLogger('update_admin_token'),
     check_liquidated_loan: log4js.getLogger('check_liquidated_loan'),
     check_defaulted_loan: log4js.getLogger('check_defaulted_loan'),
     event_log_reading: log4js.getLogger('event_log_reading'),
    //  connect: log4js.connectLogger(log4js.getLogger('check_bank_transfer'), { level: 'info' }),
 };
 