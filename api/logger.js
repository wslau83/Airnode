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
        bank_transfer: {
            type: 'dateFile',
            pattern: 'yyyy-MM-dd',
            filename: `${logLocation}/bank_transfer/bank_transfer.log`
        },
        search_loan: {
            type: 'dateFile',
            pattern: 'yyyy-MM-dd',
            filename: `${logLocation}/search_loan/search_loan.log`
        }
    },
    categories: {
        default: {
            appenders: ['default'],
            level: 'error'
        },
        bank_transfer: {
            appenders: ['bank_transfer'],
            level: 'debug'
        },
        search_loan: {
            appenders: ['search_loan'],
            level: 'debug'
        }
    }
});

module.exports = {
    default: log4js.getLogger('default'),
    bank_transfer: log4js.getLogger('bank_transfer'),
    search_loan: log4js.getLogger('search_loan'),
    connect: log4js.connectLogger(log4js.getLogger('bank_transfer'), { level: 'info' }),
};
