const express = require('express');

const bank_transfer = require('./bank_transfer');
const search_loan = require('./search_loan');
const logger = require('./logger');

var cors = require('cors');
const app = express();

var allowedOrigins = ['http://localhost:3000'];

app.use(cors({
    origin: function(origin, callback){
      // allow requests with no origin 
      // (like mobile apps or curl requests)
      if(!origin) return callback(null, true);
      if(allowedOrigins.indexOf(origin) === -1){
        var msg = 'The CORS policy for this site does not ' +
                  'allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    }
}));

const port = 8082;

// app.use(logger.connect);
app.use('/bankTransfer', bank_transfer);
app.use('/searchLoan', search_loan);

app.use((err, req, res, next) => {
  res.status(err.status || 400).json({
    success: false,
    message: err.message || 'An error occured.',
    errors: err.error || [],
  });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Resource not found.' });
});

// Start the server
app.listen(port);

console.log(`Listening on port ${port}...`);
