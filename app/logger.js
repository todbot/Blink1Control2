'use strict';

// logconfig is set by main.js (global.logconfig) for Node contexts.
// In the renderer bundle, global === window, so window.logconfig is undefined
// and defaults are used instead.
var logconfig = (typeof global !== 'undefined' && global.logconfig)
    ? global.logconfig
    : { maxEvents: 100, ignoredSources: [], showDebug: false };
if (!logconfig.maxEvents) { logconfig.maxEvents = 100; }
if (!logconfig.ignoredSources) { logconfig.ignoredSources = []; }

var Logger = {
  msg: function(/* msg,msg,msg */) {
    var iargs = arguments;
    if( logconfig.showDebug ) {
      var ignore = logconfig.ignoredSources.some( function(is) {
        return iargs[0].toString().match(is) ;
      });
      if( ignore ) { return; }

      var args = Array.prototype.slice.call(arguments);
      args.unshift( new Date().getTime() + ':');
      console.log.apply(console, args );
    }
  },
  warn: function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift( Math.floor(new Date().getTime()/1000) + ':');
    console.warn.apply(console, args);
  },
  error: function() {
    var args = Array.prototype.slice.call(arguments);
    args.unshift( Math.floor(new Date().getTime()/1000) + ':');
    console.error.apply(console, args);
  }
};

module.exports = Logger;
