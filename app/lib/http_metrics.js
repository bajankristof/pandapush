var statsd = require('./statsd'),
    bayeux = require('./bayeux'),
    _      = require('lodash');

var interval = process.env.CONNECTIONS_STATS_INTERVAL || 5000;

module.exports = function(http) {
  var connections = 0,
      wsConnections = 0;

  http.on('connection', function(socket) {
    connections += 1;

    socket.on('close', function(error) {
      connections -= 1;
    });
  });

  http.on('upgrade', function(request, socket) {
    wsConnections += 1;

    socket.on('close', function(error) {
      wsConnections -= 1;
    });
  });

  // periodically send to the number of open connections to all servers
  function sendStats() {
    bayeux.getInternalClient().publish('/internal/meta/statistics', {
      source: process.env.HOSTNAME + '-' + process.pid,
      stats: {
        connections: connections,
        wsConnections: wsConnections
      }
    });
  }
  setInterval(sendStats, interval);

  // collect all the responses from all clients for the interval * 2, aggregate
  // them, and send to statsd. (yes, this will result in duplicate information
  // to statsd, but that's fine because it's a gauge)
  var stats = {};
  bayeux.getInternalClient().subscribe("/internal/meta/statistics", function(data) {
    stats[data.source] = data.stats;
  });

  function sendStatsToStatsd() {
    var totalConnections = 0,
        totalWsConnections = 0;

    _.each(_.values(stats), function(stat) {
      totalConnections += stat.connections;
      totalWsConnections += stat.wsConnections;
    });

    statsd.gauge('connections.http', totalConnections);
    statsd.gauge('connections.ws', totalWsConnections);
    stats = {};
  }
  setInterval(sendStatsToStatsd, interval * 2);
};
