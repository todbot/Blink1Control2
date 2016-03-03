'use strict';

var _  = require('lodash');

var isDevel = 'production';

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

console.log("logger: isDevel",isDevel);

var Logger = {

	msg: function(/* msg,msg,msg */) {
        if( isDevel ) {
            console.log(":" + _.join(arguments, ' ') );
        }
        else {
            // do nothing, but later, log to file?
        }
	},

};

module.exports = Logger;
