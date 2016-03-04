"use strict";

var express      = require('express');

var config = require('../configuration');
var log = require('../logger');

/*
var enableApiServer = false;
var apiPort = 8935;


function handleHttpRequest(request, response){
	response.end('It Works!! Path Hit: ' + request.url);
}
if( enableApiServer ) {
	var server = http.createServer(handleHttpRequest);
	server.listen(apiPort, function() {
		//Callback triggered when server is successfully listening. Hurray!
		console.log("Server listening on: http://localhost:%s", apiPort);
	});
}
*/
var app = express();

app.get('/', function (req, res) {
	res.send('Hello World!');
});
app.get('/blink1', function(req,res) {
	res.send('blink1 in the house');
});

var apiServer = {
	server: null,

	init: function() { // FIXME: bad name
		// config.saveSettings("apiServer:port",8934);
		// config.saveSettings("apiServer:enabled", false);
		// config.saveSettings("apiServer:host", 'localhost');
	},
	start: function() {
		if( !config.readSettings("apiServer:enabled") ) {
			return;
		}
		var port = config.readSettings("apiServer:port") || 8934;
		this.server = app.listen(port);

		// this.server = http.createServer(this.handleHttpRequest);
		// this.server.listen(port, function() {
		// 	//Callback triggered when server is successfully listening. Hurray!
		// 	log.msg("ApiServer: listening on: http://localhost:%s", port);
		// 	// config.saveSettings("apiServer", {port: port, enabled: true});
		// });

	},

	stop: function() {
		if( this.server ) {
			this.server.close();
		}
		// config.saveSettings("apiServer:enabled", false);
	},

	handleHttpRequest: function(request, response) {
		response.end('It Works!! Path Hit: ' + request.url);
	}

};

module.exports = apiServer;
