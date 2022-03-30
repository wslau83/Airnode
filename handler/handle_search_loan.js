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

let getInitiatedLoansByDefaultQuery = {
    text: ' \
        SELECT cl.* FROM COLLATERALIZED_LOAN cl \
        INNER JOIN \
        COLLATERALIZED_LOAN_STATUS cls \
        ON cl.LOAN_STATUS_CODE = cls.LOAN_STATUS_CODE \
        WHERE cls.LOAN_STATUS_DESC = \'LoanInitiated\' \
        AND cl.LENDER <> $1 \
        ORDER BY cl.LAST_UPDATE_TIME DESC \
        LIMIT 100 \
    ',
    // values: ['Brian', 'Carlson'],
    // rowMode: 'array',
}

let getLoanDetailsQuery = {
    text: ' \
        SELECT cl.* FROM COLLATERALIZED_LOAN cl \
        INNER JOIN \
        COLLATERALIZED_LOAN_STATUS cls \
        ON cl.LOAN_STATUS_CODE = cls.LOAN_STATUS_CODE \
        WHERE cls.LOAN_STATUS_DESC = \'LoanInitiated\' \
        AND cl.LOAN_ID = $1 \
        AND cl.LENDER = $2 \
        ORDER BY cl.LAST_UPDATE_TIME DESC \
    ',
}

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

const handleGetInitiatedLoansByDefault = (req, res) => {
    var logger = getLogger();
    let userAddress = req.headers['user-address'];
    let values = [userAddress];
    client.query(getInitiatedLoansByDefaultQuery, values, (err, data) => {
        if(data) {
            // console.log(data.rows.length)
            res.status(200).send(data.rows);
        } else {
            logger.error(err)
            res.status(500).json({"error": "internal server error"});
        }
    })
}

const isNumeric = (str) => {
    if (typeof str != "string") return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
}

const mapRangeFilterValueToSQL = (rangeFilterValue) => {
    switch(rangeFilterValue) {
        case "LESS_THAN": return "<"
        case "LESS_THAN_OR_EQUAL_TO": return "<="
        case "EQAUL_TO": return "="
        case "GREATER_THAN": return ">"
        case "GREATER_THAN_OR_EQAUL_TO": return ">="
        case "NOT_EQUAL_TO": return "<>"
        case "BETWEEN": return "<=>"
        default: return ""
    }
}

const handleGetInitiatedLoansByFilter = (req, res) => {
    var logger = getLogger();

    let getInitiatedLoansByFilterQuery = {
        text: ' \
            SELECT cl.* FROM COLLATERALIZED_LOAN cl \
            INNER JOIN \
            COLLATERALIZED_LOAN_STATUS cls \
            ON cl.LOAN_STATUS_CODE = cls.LOAN_STATUS_CODE \
            WHERE cls.LOAN_STATUS_DESC = \'LoanInitiated\' \
            AND cl.LENDER <> $1 \
            $$PARAM_SQL$$ \
            ORDER BY cl.LAST_UPDATE_TIME DESC \
            LIMIT 100 \
        ',
    }

    let collateralAmountFrom = req.query.collateralAmountFrom;
    let collateralAmountTo = req.query.collateralAmountTo;
    let collateralAmountRangeFilterValue = mapRangeFilterValueToSQL(req.query.collateralAmountRangeFilterValue);

    let borrowAmountFrom = req.query.borrowAmountFrom;
    let borrowAmountTo = req.query.borrowAmountTo;
    let borrowAmountRangeFilterValue = mapRangeFilterValueToSQL(req.query.borrowAmountRangeFilterValue);

    let aprFrom = req.query.aprFrom;
    let aprTo = req.query.aprTo;
    let aprRangeFilterValue = mapRangeFilterValueToSQL(req.query.aprRangeFilterValue);

    let loanTerm = req.query.loanTerm;

    let filterSql = "";
    if(collateralAmountRangeFilterValue === "<=>") {
        if(collateralAmountFrom && collateralAmountTo && isNumeric(collateralAmountFrom) && isNumeric(collateralAmountTo)) {
            filterSql += ` AND COLLATERAL_AMOUNT BETWEEN ${collateralAmountFrom} AND ${collateralAmountTo}`;
        }
    } else {
        if(collateralAmountFrom && isNumeric(collateralAmountFrom)) {
            filterSql += ` AND COLLATERAL_AMOUNT ${collateralAmountRangeFilterValue} ${collateralAmountFrom}`;
        }
    }

    if(borrowAmountRangeFilterValue === "<=>") {
        if(borrowAmountFrom && borrowAmountTo && isNumeric(borrowAmountFrom) && isNumeric(borrowAmountTo)) {
            filterSql += ` AND LOAN_AMOUNT BETWEEN ${borrowAmountFrom} AND ${borrowAmountTo}`;
        }
    } else {
        if(borrowAmountFrom && isNumeric(borrowAmountFrom)) {
            filterSql += ` AND LOAN_AMOUNT ${borrowAmountRangeFilterValue} ${borrowAmountFrom}`;
        }
    }

    if(aprRangeFilterValue === "<=>") {
        if(aprFrom && aprTo && isNumeric(aprFrom) && isNumeric(aprTo)) {
            filterSql += ` AND APR BETWEEN ${aprFrom} AND ${aprTo}`;
        }
    } else {
        if(aprFrom && isNumeric(aprFrom)) {
            filterSql += ` AND APR ${aprRangeFilterValue} ${aprFrom}`;
        }
    }

    if(loanTerm && isNumeric(loanTerm)) {
        filterSql += ` AND LOAN_TERM = ${loanTerm}`;
    }

    let userAddress = req.headers['user-address'];
    let values = [userAddress];

    if(filterSql !== "") {
        getInitiatedLoansByFilterQuery.text = getInitiatedLoansByFilterQuery.text.replace("$$PARAM_SQL$$", filterSql);

        client.query(getInitiatedLoansByFilterQuery, values, (err, data) => {
            if(data) {
                // console.log(data.rows)
                res.status(200).send(data.rows);
            } else {
                logger.error(err)
                res.status(500).json({"error": "internal server error"});
            }
        })
    } else {
        client.query(getInitiatedLoansByDefaultQuery, values, (err, data) => {
            if(data) {
                // console.log(data.rows)
                res.status(200).send(data.rows);
            } else {
                logger.error(err)
                res.status(500).json({"error": "internal server error"});
            }
        })
    }
}

const handleGetLoanDetails = (req, res) => {
    var logger = getLogger();

    let loanId = req.params['loanId'];
    let userAddress = req.headers['user-address'];
    let values = [loanId, userAddress];
    // getLoanDetailsQuery.values = [loanId];
    client.query(getLoanDetailsQuery, values, (err, data) => {
        if(data) {
            // console.log(data.rows)
            res.status(200).send(data.rows);
        } else {
            logger.error(err)
            res.status(500).json({"error": "internal server error"});
        }
    })
}


module.exports = {
    handleGetInitiatedLoansByDefault,
    handleGetInitiatedLoansByFilter,
    handleGetLoanDetails,
};