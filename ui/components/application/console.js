/** @jsx React.DOM */

'use strict';

var React         = require('react'),
    Router        = require('react-router'),
    Route         = Router.Route,
    Link          = Router.Link,
    moment        = require('moment'),
    _             = require('lodash'),
    $             = window.jQuery,
    ChannelPicker = require('../channel_picker');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      subChannel: null,
      events: []
    };
  },

  loadData: function() {
    $.getJSON('/admin/api/applications', function(data) {
      var app = _.find(data, { application_id: this.props.params.id });
      this.setState({ app: app });
    }.bind(this));
  },

  componentDidMount: function() {
    this.loadData();
  },

  handlePublish: function(e) {
    e.preventDefault();

    var channel = this.refs["pubChannel"].get(),
        payload = this.refs["pubPayload"].getDOMNode().value;

    try {
      payload = JSON.parse(payload);
    }
    catch(e) {
      alert('Payload must be valid JSON.\n\n' + e.message);
      return;
    }

    this.props.getToken(this.props.app.application_id, channel, function(err, token) {
      if (err) {
        alert("error getting token.\n\n" + err);
        return;
      }

      $.ajax({
        type: 'POST',
        url: '/channel' + channel,
        data: JSON.stringify(payload),
        contentType: 'application/json; charset=utf-8',
        beforeSend: function(xhr) {
          xhr.setRequestHeader('Authorization', 'Token ' + token);
        },
        success: function(data) {
        }
      });
    });
  },

  handleSubscribe: function(e) {
    e.preventDefault();

    var channel = this.refs["subChannel"].get();

    var doSubscribe = function() {
      this.props.client.subscribe(channel, function(message) {
        this.state.events.splice(0, 0, message);
        this.state.events = this.state.events.splice(0, 50);
        this.forceUpdate();

        if (this.state.events.length >= 50) {
          this.props.client.unsubscribe(this.state.subChannel);
          this.setState({
            subscribed: false
          });
        }
      }.bind(this));

      this.setState({
        subChannel: channel,
        subscribed: true,
        events: []
      });
    }.bind(this);

    if (this.state.subChannel) {
      this.props.client.unsubscribe(this.state.subChannel);
      doSubscribe();
    }
    else {
      doSubscribe();
    }

  },

  updateChannelParams: function(channel) {
    return function(newParams) {
      var params = this.props.query;
      params[channel + 'Type'] = newParams.channelType;
      params[channel + 'Path'] = newParams.path;

      Router.replaceWith('applicationConsole', { id: this.props.params.id }, params);
    }.bind(this);
  },

  handlePayloadChange: function(e) {
    var params = this.props.query;
    var payload = this.refs["pubPayload"].getDOMNode().value;
    if (payload.length > 1024) {
      params.payload = '';
    }
    else {
      params.payload = payload;
    }
    Router.replaceWith('applicationConsole', { id: this.props.params.id }, params);
  },

  renderEventsTable: function() {
    if (this.state.events.length == 0) {
      return "Nothing yet.";
    }

    var ary = this.state.subChannel.split('*', 2);
    var prefix = null;
    if (ary.length > 1) {
      prefix = ary[0];
    }

    var events = _.map(this.state.events, function(ev) {
      var shortenedChannel = ev.channel.replace(prefix, "");
      var channelTd = null;
      if (prefix) {
        channelTd = <td>{shortenedChannel}</td>;
      }

      return (
        <tr>
          {channelTd}
          <td>{ev.received.toISOString()}</td>
          <td><pre>{JSON.stringify(ev.data, null, 2)}</pre></td>
        </tr>
      );
    });

    var channelTh = null;
    if (prefix) {
      channelTh = <th>Channel</th>
    }

    return (
      <table className="table">
        <tbody>
          <tr>
            {channelTh}
            <th>Received</th>
            <th>Payload</th>
          </tr>

          {events}
        </tbody>
      </table>
    );
  },

  renderEvents: function() {
    if (!this.state.subChannel) {
      return null;
    }

    var subscribedImg = null;
    if (this.state.subscribed) {
      subscribedImg = <img src="/loader.gif" />;
    }

    return (
      <div className="panel panel-default">
        <div className="panel-heading">
          <div className="pull-right">
            {this.state.events.length} events
          </div>

          <h4>{subscribedImg} {this.state.subChannel}</h4>
        </div>

        <div className="panel-body">
          {this.renderEventsTable()}
        </div>
      </div>
    );
  },

  render: function() {
    return (
      <div className="container">
        <div className="row">
          <form onSubmit={this.handlePublish} className="form-horizontal" role="form">
            <div className="form-group">
              <label className="col-sm-2 control-label" htmlFor="postChannel">Publish to</label>
              <div className="col-sm-6">
                <ChannelPicker
                  ref="pubChannel"
                  applicationId={this.props.params.id}
                  type={this.props.query.pubChannelType || "public"}
                  path={this.props.query.pubChannelPath || ""}
                  updateParams={this.updateChannelParams('pubChannel')} />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-2 control-label">Payload</label>
              <div className="col-sm-4">
                <textarea onChange={this.handlePayloadChange} ref="pubPayload" className="form-control" rows="3" defaultValue={this.props.query.payload} />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-2 control-label"></label>
              <div className="col-sm-4">
                <button type="submit" className="btn btn-default">Publish</button>
              </div>
            </div>
          </form>
        </div>

        <div className="row">
          <hr />
        </div>

        <div className="row">
          <form onSubmit={this.handleSubscribe} className="form-horizontal" role="form">
            <div className="form-group">
              <label className="col-sm-2 control-label" htmlFor="postChannel">Subscribe to</label>
              <div className="col-sm-6">
                <ChannelPicker
                  ref="subChannel"
                  applicationId={this.props.params.id}
                  type={this.props.query.subChannelType || "public"}
                  path={this.props.query.subChannelPath || ""}
                  updateParams={this.updateChannelParams('subChannel')}
                  showMeta='1' />
              </div>
            </div>

            <div className="form-group">
              <label className="col-sm-2 control-label"></label>
              <div className="col-sm-4">
                <button type="submit" className="btn btn-default">Subscribe</button> (for 50 events)
              </div>
            </div>
          </form>

          {this.renderEvents()}
        </div>
      </div>
    );
  }
});
