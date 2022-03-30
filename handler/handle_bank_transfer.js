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
 * Import redis client
 */
var redis = require('redis');

/**
 * Import API fetching library
 */
var fetch = require('node-fetch');

/**
 * Import web3.js and ABI of the CollateralizedLoanGateway
 * for calling contract function through JSON RPC in runtime
 */
var Web3 = require('web3');
var CollateralizedLoanGateway = require('../contracts/CollateralizedLoanGateway.json');
var TruffleContract = require("@truffle/contract");

const admin = "0x115d602cbbD68104899a81d29d6B5b9B5d3347b7";
const adminBankAccountNo = "4020723493878483";

const is_testing = false;
let openApiHost = 'localhost:8080';
if(!is_testing)
    openApiHost = 'bank-open-api.herokuapp.com';

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

// const handleGetFulfillFiatTransferredRequest = (req, res) => {
//     const redisClient = redis.createClient(6379, '127.0.0.1');

//     let web3 = new Web3();
//     var collateralizedLoanGateway = TruffleContract(CollateralizedLoanGateway);
//     collateralizedLoanGateway.setProvider(new web3.providers.HttpProvider("http://localhost:7545"));
    
//     let logStart = 0;
//     const logEnd = 'latest';
//     const topic = 'FiatMoneyTransferredToBank';

//     // Read the logs starting from last read log/block Index, and ending at last generated block index
//     redisClient.get(`lastRead${topic}LogIndex`, (error, result) => {
//         logger.debug(`lastRead${topic}LogIndex ->` + result);


//         // Start from last end block index + 1
//         if(result) {
//             logStart = parseInt(result) + 1;
//         }

//         logger.debug('Event log range: ', logStart, ' to ',  logEnd);

//         collateralizedLoanGateway.deployed().then((instance) => {
//             instance.getPastEvents(topic, {fromBlock: logStart, toBlock: logEnd}).then((eventArr, err) => {
//                 redisClient.on('connect', () => {
//                     logger.debug('Redis redisClient connected');
//                 });
    
//                 let logCount = 0;
//                 let lastBlockNumber = 0;
                
//                 let updateAccountAndDEXBalance = async function(i){
//                     // A single requestSpec from the event log
//                     let event = eventArr[i];

//                     // Check if the user token is stored is Redis by matching the user address
//                     redisClient.get('token_admin', async (error, token) => {

//                         if (error) {
//                             logger.error(error);
//                             throw error;
//                         }

//                         if(token === null || token === undefined) {
//                             // TODO: admin token not found in redis
//                         }
                        
//                         // The transaction amount in USD will be added to the saving account
//                         // DR: deduct balance, CR: add balance
//                         // var txn = {
//                         //     "txnAmount": event.returnValues['_value']
//                         //     , "currency": "USD"
//                         //     , "accountOp": "CR"
//                         // }

//                         var txn = {
//                             "fromAccount": adminBankAccountNo
//                             , "toAccount": event.returnValues['_bankAccountNo']
//                             , "txnAmount": event.returnValues['_value']
//                             , "currency": "USD"
//                         }

//                         // Call Open API endpoint POST /api/v1/accountTxn/{accountNo}
//                         const requestSpec = {
//                             method: 'POST',
//                             headers: {
//                                 'Content-Type': 'application/json'
//                                 , 'Authorization': 'Bearer ' + token
//                             },
//                             body: JSON.stringify(txn)
//                         };
                    
//                         // Submit the transaction to the Open API endpoint
//                         const submitTxn = async (url) => {
//                             logger.info('\n-------------------------fulfillFiatTransferredRequest Start.-----------------------\n');
//                             try {
//                                 const response = await fetch(url, requestSpec);
//                                 return response.text().then(function (resp) {
//                                     try {
//                                         logger.info('Response status: ' + response.status);
//                                         if(response.status === 200) {
//                                             logger.info('Response from Open API: ' + JSON.stringify(JSON.parse(resp), null, 2));
//                                         } else {
//                                             logger.debug('Error from Open API: ' + resp);
//                                         }

//                                         // Make sure the response status from Open API is 200 OK
//                                         if(response.status != 200) {
//                                             return false;
//                                         } else {
//                                             return true;
//                                         }
//                                     } catch(error) {
//                                         logger.error(error);
//                                         return false;
//                                     }
//                                 });
                                
//                             } catch (err) {
//                                 return false;
//                             }
//                         }

//                         // Submit the transaction to Open API endpoint
//                         // If success, the fiat balance on the Transactions contract will be deducted
//                         // Otherwise, the fiat balance will not be updated
//                         submitTxn(`http://${openApiHost}/api/v1/fundTransfer`).then((success) => {
//                             if(success) {
//                                 instance.withdrawFiatMoney(event.returnValues['_address'], event.returnValues['_value'], {from: admin}).then((response, err) => {
//                                     if(!err){
//                                         logger.info(`Fiat transfer to bank completed for address ${event.returnValues['_address']}, account number ${event.returnValues['_bankAccountNo']} with txnAmount ${event.returnValues['_value']}`);
//                                         logger.info('\n-------------------------fulfillFiatTransferredRequest End.-------------------------\n');
//                                         res.status(200).send('OK');
//                                     } else {
//                                         logger.error(err);
//                                         logger.error(`Fiat transfer to bank failed for address ${event.returnValues['_address']}, account number ${event.returnValues['_bankAccountNo']} with txnAmount ${event.returnValues['_value']}`);
//                                         logger.error(`${topic} at block ${event.blockNumber}: Error occurred on the side of CollateralizedLoanGateway`);
//                                         logger.info('\n-------------------------fulfillFiatTransferredRequest End.-------------------------\n');
//                                         res.status(500).send({'error': error});
//                                     }
                                    
//                                 });
//                             } else {
//                                 logger.error(`Fiat transfer to DEX failed when calling Open API for address ${event.returnValues['_address']}, account number ${event.returnValues['_bankAccountNo']} with txnAmount ${event.returnValues['_value']}`);
//                                 logger.info('\n-------------------------fulfillFiatTransferredRequest End.-------------------------\n');
//                                 res.status(500).send({'error': 'Fiat transfer to bank failed when calling Open API'});
//                             }
//                         }).catch((error) => {
//                             logger.error(error);
//                             logger.info('\n-------------------------fulfillFiatTransferredRequest End.-------------------------\n');
//                             res.status(500).send({'error': error});
//                         });
//                     });
                
//                     logCount++;
//                     lastBlockNumber = event.blockNumber;
//                     logger.info('logCount: ' + logCount);
//                 }

//                 // A timeout function for setting delay between async operations
//                 let timeout = (ms) => {
//                     return new Promise(resolve => setTimeout(resolve, ms));
//                 }
                
//                 // Update the account balance with 0.1 second interval delay
//                 let main = async () => {
//                     var i = 0;
//                     while (i < eventArr.length) {
//                         await Promise.all([
//                             updateAccountAndDEXBalance(i),
//                             timeout(100)
//                         ]);

//                         i++;
//                     }
//                 }

//                 // Execute the main function
//                 main();
    
//                 // Record down the last read log/block index
//                 redisClient.get('lastRead' + topic + 'LogIndex', (error, result) => {
//                     if (error) {
//                         logger.error(error);
//                         throw error;
//                     }

//                     if(lastBlockNumber != 0) {
//                         redisClient.set('lastRead' + topic + 'LogIndex', lastBlockNumber, redis.print);
//                     }
//                 });
    
//                 // Write the resolved requests as response body and return back to client
//                 // res.send(eventArr);

//             });
//         });
//     });
// }

// const handlePostAdminLogin = (req, res) => {
//     var logger = getLogger();

//     const redisClient = redis.createClient(6379, '127.0.0.1');

//     if(!('apikey' in req.headers)) {
//         res.status(400).send("Missing apiKey in request header");
//         return null;
//     }

//     let apiKey = req.headers['apikey'];
//     if(apiKey !== "testingAPIKey") {
//         res.status(400).send("Invalid API Key");
//         return null;
//     }

//     // Username and password have to be provided by the user
//     const data = {
//         "username": "CLPLimited"
//         , "password": "6AtK+XFGONq9SfgMwu5tDg=="
//     };

//     // Call Open API endpoint POST /api/v1/auth/registry/user/login
//     const requestSpec = {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(data)
//     };
    
//     // Set the expiration of the token lifetime to 30 minutes in Redis
//     const expireMinutes = 60 * 30;

//     // Retrieve admin token from the Open API
//     const retrieveAdminToken = async (url) => {
//         try {
//             const response = await fetch(url, requestSpec);
//             return response.text().then(function (token) {
//                 return token;
//             });
//         } catch (err) {
//             logger.error(err);
//             return null;
//         }
//     }

//     // If account name and password are valid, the token will be successfully generated and stored in Redis
//     // Otherwise, return "Invalid credential" back to user
//     retrieveAdminToken(`http://${openApiHost}/api/v1/auth/registry/user/login`).then((resp) => {
//         if(resp) {
//             let token = JSON.parse(resp)['jwt-token'];
//             redisClient.set('token_admin', token, 'EX', expireMinutes, function (err, respFromRedis) {
//                 redisClient.get('token_admin', (error, result) => {
//                     // logger.debug('retrieveUserToken: ' + result);
//                     logger.debug(`retrieved JWT for admin`);
//                 });
                
//                 if(err) {
//                     logger.error(err);
//                     res.status(404).send({'error': "Something wrong in admin login"});
//                 }
                
//                 // res.status(200).send(token);
//                 res.status(200).send({'message': "OK"});
//             });
//         } else {
//             res.status(401).send({'error': "Invalid credential"});
//         }
//     }).catch((error) => {
//         logger.error(error);
//         res.status(500).send({'error': error});
//     });
// }

const handlePostLogin = (req, res) => {
    var logger = getLogger();

    const redisClient = redis.createClient(6379, '127.0.0.1');

    if(!('username' in req.body && 'password' in req.body && 'userAddress' in req.body)) {
        res.status(400).send("Invalid request body");
        return null;
    }

    // Username and password have to be provided by the user
    const data = {
        "username": req.body.username
        , "password": req.body.password
    };

    // Call Open API endpoint POST /api/v1/auth/registry/user/login
    const requestSpec = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    };
    
    // Set the expiration of the token lifetime to 30 minutes in Redis
    const expireMinutes = 60 * 30;

    // Retrieve user token from the Open API
    const retrieveUserToken = async (url) => {
        try {
            const response = await fetch(url, requestSpec);
            return response.text().then(function (token) {
                return token;
            });
        } catch (err) {
            logger.error(err);
            return null;
        }
    }

    // If account name and password are valid, the token will be successfully generated and stored in Redis
    // Otherwise, return "Invalid credential" back to user
    retrieveUserToken(`http://${openApiHost}/api/v1/auth/registry/user/login`).then((resp) => {
        if(resp) {
            let token = JSON.parse(resp)['jwt-token'];
            redisClient.set('token:' + req.body.userAddress.toLowerCase().trim(), token, 'EX', expireMinutes, function (err, respFromRedis) {
                redisClient.get('token:' + req.body.userAddress.toLowerCase().trim(), (error, result) => {
                    // logger.debug('retrieveUserToken: ' + result);
                    logger.debug(`retrieved JWT for ${req.body.userAddress.toLowerCase().trim()}`);
                });
                
                if(err) {
                    logger.error(err);
                    res.status(404).send({'error': "Something wrong in admin login"});
                }
                
                // res.status(200).send(token);
                res.status(200).send({'message': "OK"});
            });
        } else {
            res.status(401).send({'error': "Invalid credential"});
        }
    }).catch((error) => {
        logger.error(error);
        res.status(500).send({'error': error});
    });
}

const handleGetUserAccountInfo = (req, res) => {
    var logger = getLogger();

    let userAddress = req.params['userAddress'];

    const redisClient = redis.createClient(6379, '127.0.0.1');

    redisClient.on('connect', () => {
        logger.debug('Redis redisClient connected');
    });

    redisClient.get('token:' + userAddress.toLowerCase().trim(), async (error, token) => {
        if (error) {
            logger.error(error);
            throw error;
        }

        // Call Open API endpoint GET /api/v1/accountInfoEnquiry
        const requestSpec = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
                , 'Authorization': 'Bearer ' + token
            },
        };

        // Get account info of the current user
        const retrieveUserAccountInfo = async (url) => {
            try {
                const response = await fetch(url, requestSpec);
                return response.text().then(function (token) {
                    return token;
                });
            } catch (err) {
                logger.error(err);
                return null;
            }
        }

        // Only contains the account with USD balance
        retrieveUserAccountInfo(`http://${openApiHost}/api/v1/accountInfoEnquiry?currency=USD`).then((accountInfo) => {
            if(accountInfo) {
                res.setHeader('Content-Type', 'application/json');
                res.status(200).send(accountInfo);
            }
        }).catch((error) => {
            logger.error(error);
            res.status(500).send({'error': error});
        });

    });
}

const handlePostTransferFiatToDEX = (req, res) => {
    var logger = getLogger();
    
    let userAddress = req.body.userAddress;
    let txnAmount = req.body.txnAmount;
    let bankAccountNo = req.body.bankAccountNo;

    const redisClient = redis.createClient(6379, '127.0.0.1');

    var web3 = new Web3();
    var collateralizedLoanGateway = TruffleContract(CollateralizedLoanGateway);
    collateralizedLoanGateway.setProvider(new web3.providers.HttpProvider("http://localhost:7545"));

    redisClient.on('connect', () => {
        logger.debug('Redis redisClient connected');
    });

    redisClient.get('token:' + userAddress.toLowerCase().trim(), async (error, token) => {
        if (error) {
            logger.error(error);
            throw error;
        }

        collateralizedLoanGateway.deployed().then((instance) => {
        
            // The transaction amount in USD will be deducted from the saving account
            // DR: deduct balance, CR: add balance
            // var txn = {
            //     "txnAmount": txnAmount
            //     , "currency": "USD"
            //     , "accountOp": "DR"
            // }

            var txn = {
                "fromAccount": bankAccountNo
                , "toAccount": adminBankAccountNo
                , "txnAmount": txnAmount
                , "currency": "USD"
            }

            // Call Open API endpoint GET /api/v1/accountTxn/
            const requestSpec = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                    , 'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(txn)
            };

            // Get account info of the current user
            const transferFiatToDEX = async (url) => {
                logger.info('\n-------------------------transferFiatToDEX Start.-----------------------\n');

                try {
                    const response = await fetch(url, requestSpec);
                    return response.text().then(function (resp) {
                        try {
                            logger.debug('Response status: ' + response.status);
                            if(response.status === 200) {
                                logger.debug('Response from Open API: ' + JSON.stringify(JSON.parse(resp), null, 2));
                            } else {
                                logger.debug('Error from Open API: ' + resp);
                            }

                            // Make sure the response status from Open API is 200 OK
                            if(response.status != 200) {
                                return false;
                            } else {
                                return true;
                            }
                        } catch(error) {
                            logger.error(error);
                            return false;
                        }
                    });
                    
                } catch (err) {
                    return false;
                }
            }

            // Only contains the account with USD balance
            transferFiatToDEX(`http://${openApiHost}/api/v1/fundTransfer`).then((success) => {
                if(success) {
                    instance.storeFiatMoney(userAddress, txnAmount, {from: userAddress}).then((response, err) => {
                        if(!err){
                            logger.debug(`Fiat transfer to DEX completed for address ${userAddress}, account number ${bankAccountNo} with txnAmount ${txnAmount}`);
                            logger.info('\n-------------------------transferFiatToDEX End.-------------------------\n');
                            res.status(200).send({'message': "OK"});
                        } else {
                            logger.error(`Fiat transfer to DEX failed when calling smart contract for address ${userAddress}, account number ${bankAccountNo} with txnAmount ${txnAmount}`);
                            logger.info('\n-------------------------transferFiatToDEX End.-------------------------\n');
                            res.status(500).send({'error': 'Fiat transfer to DEX failed when calling smart contract'});
                        }
                    });
                } else {
                    logger.error(`Fiat transfer to DEX failed when calling Open API for address ${userAddress}, account number ${bankAccountNo} with txnAmount ${txnAmount}`);
                    logger.info('\n-------------------------transferFiatToDEX End.-------------------------\n');
                    res.status(500).send({'error': 'Fiat transfer to DEX failed when calling Open API'});
                }
            }).catch((error) => {
                logger.error(error);
                logger.info('\n-------------------------transferFiatToDEX End.-------------------------\n');
                res.status(500).send({'error': error});
            });
        });
    });
}

module.exports = {
    // handleGetFulfillFiatTransferredRequest,
    // handlePostAdminLogin,
    handlePostLogin,
    handleGetUserAccountInfo,
    handlePostTransferFiatToDEX,
};