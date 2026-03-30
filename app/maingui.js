
"use strict";

// begin requires for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');
require('../node_modules/react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css');
// end requires for webpack

var React = require('react');
var { createRoot } = require('react-dom/client');
var createReactClass = require('create-react-class');
React.createClass = createReactClass; // shim for legacy deps (react-bootstrap-switch)

var MenuMaker = require('./menuMaker');
MenuMaker.setupMainMenu();
MenuMaker.setupTrayMenu();

var Blink1ControlView = require('./components/gui/blink1ControlView');
var App = createReactClass({
  render: function() {
    return ( <Blink1ControlView /> );
  }
});
var root = createRoot(document.getElementById('app'));
root.render(<App />);
