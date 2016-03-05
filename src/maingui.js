
"use strict";

// this is for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-yeti.min.css');
//require('../node_modules/bootstrap/dist/css/bootstrap-lumen.min.css');
//require('../bootstrap-sb-admin-2.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');

var React = require('react');
var ReactDOM = require('react-dom');

// TESTING BEGIN
// var express      = require('express');
// var appsrv = express();
// appsrv.get('/', function (req, res) {
// 	res.send('Blink1Control2 API server');
// });
// var server = appsrv.listen(5245);
//
// var Blink1 = require('node-blink1');
// var devices = Blink1.devices();
// console.log("Blink1 devices:", devices);

// var HID = require('node-hid');
// var devices = HID.devices();
// console.log("HID devices:", devices);

// var serialPort = require("serialport");
// serialPort.list(function (err, ports) {
//   ports.forEach(function(port) {
//     console.log(port.comName);
//     console.log(port.pnpId);
//     console.log(port.manufacturer);
//   });
// });

// TESTING END

var Blink1ControlView = require('./components/gui/blink1ControlView');

var App = React.createClass({
  render: function() {
    return (
		// <div className="container-fluid">
			<Blink1ControlView />
        // </div>
    );
  }
});

// window.onbeforeunload = function(e) {
//     // console.log('I do not want to be closed');
//     return true;
// };

ReactDOM.render( <App />, document.getElementById('app'));
