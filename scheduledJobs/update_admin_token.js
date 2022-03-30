/**
 * Import redis client
 */
var redis = require('redis');

/**
 * Import API fetching library
 */
var fetch = require('node-fetch');

const is_testing = false;
let openApiHost = 'localhost:8080';
if(!is_testing)
    openApiHost = 'bank-open-api.herokuapp.com';

const Logger = require('./logger');
const handleAdminLogin = () => {
    require('dotenv').config({path: '../.env'});
    let logger = Logger.update_admin_token;
    // logger.info('testing1234');

    const redisClient = redis.createClient(6379, '127.0.0.1');

    // Username and password have to be provided by the user
    const crendentials = {
        "username": process.env.AIRNODE_ADMIN_API_LOGIN_ACCOUNT
        , "password": process.env.AIRNODE_ADMIN_API_LOGIN_PASSWORD
    };

    // Call Open API endpoint POST /api/v1/auth/registry/user/login
    const requestSpec = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(crendentials)
    };
    
    // Set the expiration of the token lifetime to 30 minutes in Redis
    const expireMinutes = 60 * 30;

    // Retrieve admin token from the Open API
    const retrieveAdminToken = async (url) => {
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
    retrieveAdminToken(`http://${openApiHost}/api/v1/auth/registry/user/login`).then((resp) => {
        if(resp) {
            let token = JSON.parse(resp)['jwt-token'];
            redisClient.set('token_admin', token, 'EX', expireMinutes, function (err, respFromRedis) {
                redisClient.get('token_admin', (error, result) => {
                    // logger.debug('retrieveUserToken: ' + result);
                    logger.debug(`retrieved JWT for admin`);
                });
                
                if(err) {
                    logger.error(err);
                }
                
            });
        } else {
            logger.error("No resp");
        }
    }).catch((error) => {
        logger.error(error);
    });
}

const adminLogin = () => {
    /**
     * Check FiatMoneyTransferredToBank in event logs, frequency: every 5 minutes
     */
    try {
        handleAdminLogin();
    } catch (err) {
        logger.error("adminLogin");
        logger.error(err);
    }
}

module.exports = {
    adminLogin
};