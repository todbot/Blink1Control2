"use strict";

var http = require('http');

var config = require('../configuration');

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

var apiServer = {
	server: null,

	init: function() { // FIXME: bad name
		if( config.readSettings("apiServer:enabled") ) {
			this.start();
		}
	},
	start: function() {
		var port = config.readSettings("apiServer:port") || 8934;
		this.server = http.createServer(this.handleHttpRequest);
		this.server.listen(port, function() {
			//Callback triggered when server is successfully listening. Hurray!
			console.log("Server listening on: http://localhost:%s", port);
			config.saveSettings("apiServer", {port: port, enabled: true});
		});

	},

	stop: function() {
		this.server.close();
		config.saveSettings("apiServer:enabled", false);
	},

	handleHttpRequest: function(request, response) {
		response.end('It Works!! Path Hit: ' + request.url);
	}

};

module.exports = apiServer;
