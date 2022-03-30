var cron = require('node-cron');

var {fulfillFiatTransferredRequest} = require('./check_bank_transfer');
var {checkDefaultedLoan} = require('./check_defaulted_loan');
var {checkLoanLiquidation} = require('./check_liquidated_loan');
var {eventLogReading} = require('./event_log_reading');
var {adminLogin} = require('./update_admin_token');

//execute every 30 sec
cron.schedule('*/30 * * * * *', function(){
    console.log(`fulfillFiatTransferredRequest: Running every 30 sec at ${new Date()}`);
    fulfillFiatTransferredRequest();
});

//execute every 5 min
cron.schedule('* */5 * * * *', function(){
    console.log(`adminLogin: Running every 5 min at ${new Date()}`);
    adminLogin();
});

//execute every EOD
cron.schedule('59 59 23 * * *', function(){
    console.log(`checkDefaultedLoan: Running every EOD at ${new Date()}`);
    checkDefaultedLoan();
});

//execute every 5 min
cron.schedule('* */5 * * * *', function(){
    console.log(`checkLoanLiquidation: Running every 5 min at ${new Date()}`);
    checkLoanLiquidation();
});

//execute every 15 min
cron.schedule('* */15 * * * *', function(){
    console.log(`eventLogReading: Running every 15 min at ${new Date()}`);
    eventLogReading();
});