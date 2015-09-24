/* global $:true, jQuery:true */
/* eslint-disable strict */
/* jshint strict: false */

var React = require('react');

$ = jQuery = require('jquery');

var Blink1ControlView = require('./components/gui/blink1ControlView');

var App = React.createClass({
  render: function() {
    return (
			<div className="container-fluid">
				<Blink1ControlView />
      </div>
    );
  }
});

window.onbeforeunload = function(e) {
    console.log('I do not want to be closed');
    return true;
};

React.render( <App />, document.getElementById('app'));
