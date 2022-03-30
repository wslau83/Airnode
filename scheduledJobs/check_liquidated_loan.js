var Web3 = require('web3');
var CollateralizedLoanGateway = require('../contracts/CollateralizedLoanGateway.json');
var TruffleContract = require("@truffle/contract");

var ReconnectingWebSocket = require('reconnecting-websocket');
var WS = require('ws');

const { Client } = require('pg')
const client = new Client({
    user: process.env.POSTGRES_DATABASE_USERNAME,
    host: process.env.POSTGRES_DATABASE_HOST,
    database: process.env.POSTGRES_DATABASE_DATABASENAME,
    password: process.env.POSTGRES_DATABASE_PWD,
    port: process.env.POSTGRES_DATABASE_PORT,
    ssl: {
        rejectUnauthorized: false
    }
})
client.connect()

var streamEthPrice = null;

const admin = "0x115d602cbbD68104899a81d29d6B5b9B5d3347b7";

let getLoanLiquidationQuery = {
    text: ' \
        SELECT cl.LOAN_ID FROM COLLATERALIZED_LOAN cl \
        INNER JOIN \
        COLLATERALIZED_LOAN_STATUS cls \
        ON cl.LOAN_STATUS_CODE = cls.LOAN_STATUS_CODE \
        WHERE cls.LOAN_STATUS_DESC = \'LoanRepaying\' \
        AND cl.LOAN_AMOUNT / (cl.COLLATERAL_AMOUNT * $1) >= (CAST(cl.LIQUIDATION_LTV AS FLOAT) / 100)\
    ',
}

const initiateWebsocket = async () => {
    const wsOptions = {
        WebSocket: WS,
        maxReconnectionDelay: 10000,
        minReconnectionDelay: 1000,
        connectionTimeout: 5000,
        minUptime: 5000,
        maxRetries: 10,
        reconnectionDelayGrowFactor: 1.3,
        debug: false
    }
    const url = "wss://cnode.dynamicstrategies.io:9010";
    const ws = new ReconnectingWebSocket(url, [], wsOptions);

    ws.addEventListener('open', () => {
        // console.log("Connection Established ...");
    });

    ws.addEventListener('message', (e) => {
        let dataFromServer = JSON.parse(e.data);
        if (dataFromServer.type === 'ethspot') {
            streamEthPrice = dataFromServer.values.index;
        }
    });

    ws.addEventListener('error', (e) => {
        console.log('error: ', e.data);
    });

    ws.addEventListener('close', (e) => {
        if(e.data)
            console.log('error: ', e.data);
    });

    return ws;
}

const Logger = require('./logger');
const handleCheckLoanLiquidation = async () => {
    let logger = Logger.check_liquidated_loan;
    // logger.info('liquidated1234');
    
    const getLoanLiquidationIds = async () => {
        let loanLiquidationIds = [];
        if(streamEthPrice) {
            let values = [streamEthPrice];

            let data = await client.query(getLoanLiquidationQuery, values);
            loanLiquidationIds = data.rows.map((obj) => obj['loan_id']);
        }
        return loanLiquidationIds;
    }

    let web3 = new Web3();
    var collateralizedLoanGateway = TruffleContract(CollateralizedLoanGateway);
    collateralizedLoanGateway.setProvider(new web3.providers.HttpProvider("http://localhost:7545"));

    logger.info('\n-------------------------checkLoanLiquidation Start.-----------------------\n');
    
    const wsClient = await initiateWebsocket();
    setTimeout(async () => {
        wsClient.close();
        logger.debug("streamEthPrice: " + streamEthPrice);
        // logger.info("streamEthPrice: " + streamEthPrice);
        let loanLiquidationIds = await getLoanLiquidationIds();
        logger.debug('loanLiquidationIds: ' + loanLiquidationIds);

        if(loanLiquidationIds.length > 0) {
            collateralizedLoanGateway.deployed().then(async (instance) => {
                let _collateralInUSD = [];
                let _collateralPayables = [];
                // loanLiquidationIds.forEach((loanId) => {
                for(var k = 0; k < loanLiquidationIds.length; k++) {
                    loanId = loanLiquidationIds[k];
                    let loanItem = await instance.methods['getLoanDetails(uint256)'].call(loanId, {from: admin});
                    let collateralAmountInUSD = Math.floor(web3.utils.fromWei((loanItem['collateralAmount']).toString(), "ether") * streamEthPrice);
                    let collateralPayable = web3.utils.toWei(
                        ((collateralAmountInUSD - parseInt(loanItem['loanAmount'])) / streamEthPrice).toString()
                        ,  "ether");
                    _collateralInUSD.push(collateralAmountInUSD);
                    _collateralPayables.push(collateralPayable);
                }
                // });

                logger.debug(_collateralInUSD);
                logger.debug(_collateralPayables);

                instance.liquidateLoan(loanLiquidationIds, _collateralInUSD, _collateralPayables, {from: admin}).then((response, err) => {
                    if(!err){
                        logger.debug('checkLoanLiquidation completed');
                        logger.debug(response);
                    } else {
                        logger.error('checkLoanLiquidation error found');
                        logger.error(err);
                    }
                });

                // instance.methods['liquidateLoan(uint256[],uint256[],uint256[])'].call(loanLiquidationIds, _collateralInUSD, _collateralPayables, {from: admin}, function (err, res) {
                //     if(!err){
                //         logger.debug(res);
                //     } else {
                //         logger.debug(err);
                //     }
                //     logger.info('\n-------------------------checkLoanLiquidation End.-------------------------\n');
                // });
            });
        }

        logger.info('\n-------------------------checkLoanLiquidation End.-------------------------\n');
    }, 3000);
}

const checkLoanLiquidation = async () => {
    /**
     * Check loan that reaches liquidation LTV, frequency: every 15 seconds
     */
    let logger = Logger.check_liquidated_loan;
    try {
        await handleCheckLoanLiquidation();
    } catch (err) {
        logger.error("checkLoanLiquidation");
        logger.error(err);
    }
}

module.exports = {
    checkLoanLiquidation
};