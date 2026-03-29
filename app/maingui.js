
"use strict";

// begin requires for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');
require('../node_modules/react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css');
// end requires for webpack

var React = require('react');
var ReactDOM = require('react-dom');

var MenuMaker = require('./menuMaker');
MenuMaker.setupMainMenu();
MenuMaker.setupTrayMenu();

var Blink1ControlView = require('./components/gui/blink1ControlView');
var App = React.createClass({
  render: function() {
    return ( <Blink1ControlView /> );
  }
});
ReactDOM.render( <App />, document.getElementById('app'));
