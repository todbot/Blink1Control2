/* eslint-disable strict */
/* jshint strict: false */

// this is for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-yeti.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-lumen.min.css');
//require('../bootstrap-sb-admin-2.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');

var React = require('react');
var ReactDOM = require('react-dom');

var Blink1ControlView = require('./components/gui/blink1ControlView');

// var Blink1Service = window.require('remote').require('./server/blink1Service');
// Blink1Service.fadeToColor(0,'#339933');

var App = React.createClass({
  render: function() {
    return (
		// <div className="container-fluid">
			<Blink1ControlView />
        // </div>
    );
  }
});

window.onbeforeunload = function(e) {
    // console.log('I do not want to be closed');
    return true;
};

ReactDOM.render( <App />, document.getElementById('app'));
