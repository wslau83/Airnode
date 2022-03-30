var Web3 = require('web3');
var CollateralizedLoanGateway = require('../contracts/CollateralizedLoanGateway.json');
var TruffleContract = require("@truffle/contract");

const admin = "0x115d602cbbD68104899a81d29d6B5b9B5d3347b7";

const Logger = require('./logger');
const handleCheckDefaultedLoan = () => {
    let logger = Logger.check_defaulted_loan;
    // logger.info('4321defaulted');
    
    var today = new Date();
    let todayDeadline = today.setHours(23,59,59,999);
    let checkTimestamp = Math.floor(todayDeadline / 1000);

    let web3 = new Web3();
    var collateralizedLoanGateway = TruffleContract(CollateralizedLoanGateway);
    collateralizedLoanGateway.setProvider(new web3.providers.HttpProvider("http://localhost:7545"));

    logger.info('\n-------------------------checkBorrowerDefault Start.-----------------------\n');

    collateralizedLoanGateway.deployed().then((instance) => {
        instance.checkBorrowerDefault(checkTimestamp, {from: admin}).then((response, err) => {
            if(!err){
                logger.debug('checkBorrowerDefault completed');
                logger.debug(response);
            } else {
                logger.error('checkBorrowerDefault error found');
                logger.error(err);
            }
            logger.info('\n-------------------------checkBorrowerDefault End.-------------------------\n');
        });
    });
}

const checkDefaultedLoan = () => {
    /**
     * Check loan that defaults, frequency: every EOD
     */
    let logger = Logger.check_defaulted_loan;
    try {
        handleCheckDefaultedLoan();
    } catch (err) {
        logger.error("checkDefaultedLoan");
        logger.error(err);
    }
}

module.exports = {
    checkDefaultedLoan
};
