var paypal_classic_sdk = require('paypal-classic-sdk');
var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

paypal_classic_sdk.configure({
  "host": process.env.PAYPAL_HOST,
  "path": "/nvp",
  "port": "443",
  "credentials": {
    "USER": process.env.PAYPAL_USER,
    "PWD": process.env.PAYPAL_PWD,
    "SIGNATURE": process.env.PAYPAL_SIGNATURE
  },
  "timeout": 30000,
  "paypal_api_version": "109.0"
});

app.post('/pay/:experience/:call', function (req, res) {
  try {
    var trx = paypal_classic_sdk.getModel(req.params.call);
    delete req.body._csrf;
    trx.exchangeData(req.body);
    trx.validateData();
    paypal_classic_sdk.execute(trx.getParameters(), function (err, data) {
      var response;
      if (err) {
        if (err.code != 'ECONNRESET' && data) {
          response = {
            submit: data.submit,
            response: data.response,
            error: err.message
          };
        }
        else {
          response = {
            response: { code: "ECONNRESET", message: "Timeout connecting to server.  Try again later"},
            error: err.message
          }
        }
        res.json(500, response);
      }
      else {
        res.json(200, {
          submit: data.submit,
          response: data.response
        });
      }
    });
  }
  catch (err) {
    res.json(500, {
      submit: err.submit,
      error: err.message
    });
  }
});

console.log('Listening on port', process.env.PORT);
app.listen(process.env.PORT);