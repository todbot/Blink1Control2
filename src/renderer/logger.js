'use strict';

// TO DO: add log to file
// TO DO: add log levels

var conf = require('common/blink1control2config');


// example of ignoredSources
// var ignoredSources = [
//    // /IftttService/i,
//    // /PatternView/i,
//    // /PatternList/i,
//    // /Blink1ColorPicker/i
//     // /ScriptService/
// ];

var logconfig = conf.readSettings('logger');
if( !logconfig.maxEvents ) {logconfig.maxEvents = 100; }
if( !logconfig.ignoredSources ) { logconfig.ignoredSources = []; }


var Logger = {
  /**
  * Log a message
  *
  * @method function
  * @return {[type]} [description]
  */

  msg: function(/* msg,msg,msg */) {
    var iargs = arguments;
    if( logconfig.showDebug ) {
      var ignore = logconfig.ignoredSources.some( function(is) {
        return iargs[0].toString().match(is) ;
      });
      if( ignore ) { return; }

      var args = Array.prototype.slice.call(arguments);
      // args.unshift( Math.floor(new Date().getTime()/1000) + ':');
      args.unshift( new Date().getTime() + ':');
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
