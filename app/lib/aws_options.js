var https = require('https');

module.exports = function(endpoint) {
  var options = {};

  if (endpoint) {
    options.endpoint = endpoint;
  }

  if ((options.endpoint && options.endpoint.indexOf('http://') === 0)) {
    options.sslEnabled = false;
  } else {
    // See: https://github.com/aws/aws-sdk-js/issues/116
    var agent = new https.Agent();
    agent.maxSockets = 500;
    agent.rejectUnauthorized = true;

    options.sslEnabled = true;
    options.httpOptions = { agent: agent };
  }

  return options;
};
