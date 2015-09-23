/* global $:true, jQuery:true */
/* eslint-disable strict */

var React = require('react');

$ = jQuery = require('jquery');

var Blink1ControlView = require('./components/gui/blink1ControlView');

// var remote = window.require('remote');
// var Blink1Service = remote.require('./src/server/blink1Service');
// var PatternsService = remote.require('./src/server/PatternsService');
//
// Blink1Service.startDeviceListener();
// PatternsService.initialize();

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
