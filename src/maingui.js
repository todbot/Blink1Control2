/* global $:true, jQuery:true */
/* eslint-disable strict */

var React = require('react');

$ = jQuery = require('jquery');

var Blink1ControlView = require('./components/gui/blink1ControlView');

var Blink1Api = require('./api/blink1DeviceApi');

Blink1Api.startDeviceListener();

var App = React.createClass({
  render: function() {
    return (
			<div className="container-fluid">
				<Blink1ControlView />
      </div>
    );
  }
});

React.render( <App />, document.getElementById('app'));
