'use strict';

// var _  = require('lodash');

var isDevel = false;

if( process.browser === true ) { // is in renderer process
	var remote = window.require('remote');
	var processserver = remote.require('process');
	isDevel = (processserver.env.NODE_ENV === 'development');
	console.log("process.env.NODE_ENV",processserver.env.NODE_ENV);
}
else {
	isDevel = (process.env.NODE_ENV === 'development');
}

// TO DO: add log to file
// TO DO: add log levels

// console.log("logger: isDevel",isDevel);

var Logger = {

	msg: function(/* msg,msg,msg */) {
        if( isDevel ) {
			var args = Array.prototype.slice.call(arguments);
			args.unshift( Math.floor(new Date().getTime()/1000) + ':');
            console.log.apply(console, args );
        }
        else {
            // do nothing, but later, log to file?
        }
		// FIXME: log to file?
	},
	warn: function() {
		var args = Array.prototype.slice.call(arguments);
		args.unshift( Math.floor(new Date().getTime()/1000) + ':');
		console.warn.apply(console, args);
		// FIXME: log to file?
	},
	error: function() {
		var args = Array.prototype.slice.call(arguments);
		args.unshift( Math.floor(new Date().getTime()/1000) + ':');
		console.error.apply(console, args);
		// FIXME: log to file?
	}
};

module.exports = Logger;
