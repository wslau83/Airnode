var express = require('express')
// var cors = require('cors')
var app = express()
// app.use(cors())
app.use(express.json({
    type: "*/*" // optional, only if you want to be sure that everything is parsed as JSON. Wouldn't recommend
}));

/**
 * Import Logging library
 */
// var log4js = require("log4js");
// log4js.configure({
//     appenders: { search_loan: { type: 'dateFile', pattern: 'yyyy-MM-dd', filename: `../logs/search_loan/search_loan.log` } },
//     categories: { default: { appenders: ['search_loan'], level: 'debug' } }
// });
// var logger = log4js.getLogger();
// logger.level = 'debug';
 

/**
 * Import API fetching library
 */
var fetch = require('node-fetch');

var {
    handleGetInitiatedLoansByDefault
    , handleGetInitiatedLoansByFilter
    , handleGetLoanDetails
} = require('../handler/handle_search_loan');

const getLogger = () => {
    var log4js = require("log4js");
    log4js.configure({
        appenders: { search_loan: { type: 'dateFile', pattern: 'yyyy-MM-dd', filename: `../logs/search_loan/search_loan.log` } },
        categories: { default: { appenders: ['search_loan'], level: 'debug' } }
    });
    var logger = log4js.getLogger();
    logger.level = 'debug';

    return logger;
}

// const is_testing = true;

// const port = 7070;

// app.listen(port, function (req, res) {
//    var logger = getLogger();
//    try {
//         console.log(`Listening on port ${port}...`);
//         // try {
//         //     if(is_testing) {
//         //         var seconds = 15, intervalInSeconds = seconds * 1000;
//         //         setInterval(function() {
//         //             logger.debug(`------${seconds} seconds check------`);
    
//         //             // Call the endpoint GET /discoverInitiatedLoan in the same program
//         //             const requestSpec = {
//         //                 method: 'GET'
//         //             };
                
//         //             const retrieveFiatTransferredRequest = async (url) => {
//         //                 try {
//         //                     const response = await fetch(url, requestSpec);
//         //                     response.text().then(function (resp) {
//         //                         try {
//         //                             // logger.debug(resp);
//         //                         } catch(error) {
//         //                             logger.debug(error);
//         //                         }
//         //                     });
                            
//         //                 } catch (err) {
//         //                     logger.error(err);
//         //                 }
//         //             }
                
//         //             retrieveFiatTransferredRequest('http://localhost:7070/discoverInitiatedLoan');
//         //         }, intervalInSeconds);
//         //     }
//         // } catch (err) {
//         //     logger.error("Listener: " + err);
//         // }
//     } catch (err) {
//         logger.error("Listener: " + err);
//     }
// })

/**
 * Get initiated loans from DB, by default 100 rows
 */
app.get('/initiatedLoansByDefault', function(req, res) {
    var logger = getLogger();
    try {
        handleGetInitiatedLoansByDefault(req, res);
    } catch (err) {
        logger.error("GET /initiatedLoansByDefault: " + err);
    }
})

/**
 * Get initiated loans from DB, by filter values with max 100 rows
 */
app.get('/initiatedLoansByFilter', function(req, res) {
    var logger = getLogger();
    try {
        handleGetInitiatedLoansByFilter(req, res);
    } catch (err) {
        logger.error("GET /initiatedLoansByFilter: " + err);
    }
})

/**
 * Get loan details from DB by loanId
 */
app.get('/loanDetails/:loanId', function(req, res) {
    var logger = getLogger();
    try {
        handleGetLoanDetails(req, res);
    } catch (err) {
        logger.error("GET /loanDetails/:loanId: " + err);
    }
})

module.exports = app;
