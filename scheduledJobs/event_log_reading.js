/**
 * Import Logging library
 */
var log4js = require("log4js");
log4js.configure({
    appenders: { event_log_reading: { type: 'dateFile', pattern: 'yyyy-MM-dd', filename: `../logs/event_log_reading/event_log_reading.log` } },
    categories: { default: { appenders: ['event_log_reading'], level: 'debug' } }
});
var logger = log4js.getLogger();
logger.level = 'debug';

/**
 * Import API fetching library
 */
// var fetch = require('node-fetch');

var {
    handleGetLoanInitiated,
    handleGetLoanRequested,
    handleGetLoanCancelled,
    handleGetLoanDisbursed,
    handleGetLoanRepaid,
    handleGetLoanDefaulted,
    handleGetLoanFullyRepaid,
} = require('../handler/handle_event_log_reading');

const Logger = require('./logger');
const eventLogReading = () => {
    let logger = Logger.event_log_reading;
    try {
        handleGetLoanInitiated();
        handleGetLoanRequested();
        handleGetLoanCancelled();
        handleGetLoanDisbursed();
        handleGetLoanRepaid();
        handleGetLoanDefaulted();
        handleGetLoanFullyRepaid();
    } catch (err) {
        logger.error("event_log_reading: " + err);
    }
}

module.exports = {
    eventLogReading
};
