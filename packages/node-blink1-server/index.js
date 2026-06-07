'use strict';

var EventEmitter = require('events');
var util         = require('util');

var blink1Service   = require('./lib/blink1Service');
var patternsService = require('./lib/patternsService');
var apiServer       = require('./lib/apiServer');

/**
 * createBlink1Server(options) — factory for a standalone blink(1) REST API server.
 *
 * options:
 *   blink1Config    {object}  Config for blink1Service  (deviceRescan, enableGamma, blink1ToUse, hostId)
 *   patternsConfig  {object}  Config for patternsService (playingSerialize)
 *   patterns        {Array}   Saved user patterns array
 *   apiConfig       {object}  Config for apiServer ({ port: 8934, host: 'localhost' })
 *   logger          {object}  Optional logger with .msg() and .error() methods
 *
 * The returned object extends EventEmitter and fires:
 *   'status'          ({type, source, id, text})  — service status updates
 *   'deviceUpdated'   ()                          — blink1 device list changed
 *   'patternsChanged' (patternsArray)             — user patterns saved/deleted
 *   'configChanged'   (key, value)                — config value written (e.g. hostId)
 *
 * Example:
 *   var server = require('node-blink1-server')({ apiConfig: { port: 8934 } });
 *   server.on('status', function(s) { console.log(s); });
 *   server.start();
 */
function Blink1Server(options) {
    EventEmitter.call(this);
    this._options = options || {};
}
util.inherits(Blink1Server, EventEmitter);

Blink1Server.prototype.start = function() {
    var self = this;
    var opts = this._options;
    var log  = opts.logger || null;

    blink1Service.init({
        log:     log,
        emitter: self,
    });
    patternsService.init({
        log:     log,
        emitter: self,
    });
    apiServer.init({
        blink1Service:   blink1Service,
        patternsService: patternsService,
        log:             log,
        eventer:         { addStatus: function(s) { self.emit('status', s); } },
    });

    blink1Service.start(opts.blink1Config || {});
    patternsService.initialize(opts.patternsConfig || {}, opts.patterns || []);
    apiServer.start(opts.apiConfig || { port: 8934, host: 'localhost' });
};

Blink1Server.prototype.stop = function(cb) {
    apiServer.stop(cb);
};

// Expose the underlying singletons so callers can use setSendState(), addChangeListener(), etc.
Blink1Server.prototype.blink1Service   = blink1Service;
Blink1Server.prototype.patternsService = patternsService;
Blink1Server.prototype.apiServer       = apiServer;

module.exports = function createBlink1Server(options) {
    return new Blink1Server(options);
};

// Allow require('node-blink1-server/lib/blink1Service') shim access via the package main too.
module.exports.blink1Service   = blink1Service;
module.exports.patternsService = patternsService;
module.exports.apiServer       = apiServer;
