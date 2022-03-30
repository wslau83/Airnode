/**
 * Airnode program for handling off-chain data requests
 * Listen on port 9090
 * Current endpoint:
 * - GET /fulfillFiatTransferredRequest:
 *      1. Fulfill the transfer request of fiat money from loan platform to Bank savins account through Open API
 *      2. Update the balance in Transactions contract
 * - POST /postLogin
 *      1. Get JWT from Open API
 *      2. Store the JWT in Redis and retrieve by user address as key
 * - GET /getAccountInfo/:userAddress
 *      1. Get bank account info through Open API
 * - POST /transferFiatToDEX
 *      1. Deduce account balance through Open API
 *      2. Update the balance in Transactions contract
 */

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
//     appenders: { bank_transfer: { type: 'dateFile', pattern: 'yyyy-MM-dd', filename: `../logs/bank_transfer/bank_transfer.log` } },
//     categories: { default: { appenders: ['bank_transfer'], level: 'debug' } }
// });
// var logger = log4js.getLogger();
// logger.level = 'debug';

/**
 * Import API fetching library
 */
var fetch = require('node-fetch');

var {
    // handleGetFulfillFiatTransferredRequest,
    // handlePostAdminLogin,
    handlePostLogin,
    handleGetUserAccountInfo,
    handlePostTransferFiatToDEX,
} = require('../handler/handle_bank_transfer');

const getLogger = () => {
    var log4js = require("log4js");
    log4js.configure({
        appenders: { bank_transfer: { type: 'dateFile', pattern: 'yyyy-MM-dd', filename: `../logs/bank_transfer/bank_transfer.log` } },
        categories: { default: { appenders: ['bank_transfer'], level: 'debug' } }
    });
    var logger = log4js.getLogger();
    logger.level = 'debug';
    
    return logger;
}

// const is_testing = false;

// process.setMaxListeners(Infinity);

// const port = 9090;

// app.listen(port, function (req, res) {
//     try {
//         console.log(`Listening on port ${port}...`);
//         if(is_testing) {
//             var seconds = 15, intervalInSeconds = seconds * 1000;
//             setInterval(function() {
//                 logger.debug(`------${seconds} seconds check------`);

//                 // Call the endpoint GET /fulfillFiatTransferredRequest in the same program
//                 const requestSpec = {
//                     method: 'GET'
//                 };
            
//                 const retrieveFiatTransferredRequest = async (url) => {
//                     try {
//                         const response = await fetch(url, requestSpec);
//                         response.text().then(function (resp) {
//                             try {
//                                 // logger.debug(resp);
//                             } catch(error) {
//                                 logger.debug(error);
//                             }
//                         });
                        
//                     } catch (err) {
//                         logger.error(err);
//                     }
//                 }
            
//                 retrieveFiatTransferredRequest('http://localhost:9090/fulfillFiatTransferredRequest');
//             }, intervalInSeconds);
//         }
//     } catch (err) {
//         logger.error("Listener: " + err);
//     }
// })

// /**
//  * Fulfill the request retaining in event log
//  */
// app.get('/fulfillFiatTransferredRequest', function(req, res) {
//     try {
//         handleGetFulfillFiatTransferredRequest(req, res);
//     } catch (err) {
//         logger.error("GET /fulfillFiatTransferredRequest: " + err);
//     }
// })

/**
 * Login to Open API and get a JWT as admin token with lifetime of 30 minutes
 */
//  app.post('/postAdminLogin', function (req, res) {
//     var logger = getLogger();
//     try {
//         handlePostAdminLogin(req, res);
//     } catch (err) {
//         logger.error("POST /postAdminLogin: " + err);
//     }
// })

/**
 * Login to Open API and get a JWT as user token with lifetime of 30 minutes
 */
app.post('/postLogin', function (req, res) {
    var logger = getLogger();
    try {
        handlePostLogin(req, res);
    } catch (err) {
        logger.error("POST /postLogin: " + err);
    }
})

/**
 * Get bank account info of a user
 */
app.get('/getAccountInfo/:userAddress', function (req, res) {
    var logger = getLogger();
    try {
        handleGetUserAccountInfo(req, res);
    } catch (err) {
        logger.error("GET /getAccountInfo/:userAddress: " + err);
    }
})

/**
 * Transfer fiat money from bank account to DEX
 */
app.post('/transferFiatToDEX', function (req, res) {
    var logger = getLogger();
    try {
        handlePostTransferFiatToDEX(req, res);
    } catch (err) {
        logger.error("POST /transferFiatToDEX: " + err);
    }
})

module.exports = app;