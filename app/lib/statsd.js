var lynx = require('lynx');

var host = process.env.STATSD_HOST || 'localhost',
    port = process.env.STATSD_PORT || 8125,
    prefix = process.env.STATSD_PREFIX || "pandapush",
    hostname = "";

if (process.env.HOSTNAME) {
  hostname = "." + process.env.HOSTNAME + "-" + process.pid;
}

var instance = new lynx(host, port, { scope: prefix });

exports.count     = instance.count.bind(instance);
exports.increment = instance.increment.bind(instance);
exports.decrement = instance.decrement.bind(instance);
exports.timing    = instance.timing.bind(instance);
exports.set       = instance.set.bind(instance);
exports.send      = instance.send.bind(instance);
exports.gauge     = instance.gauge.bind(instance);
