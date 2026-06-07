#!/usr/bin/env node
'use strict';

var createBlink1Server = require('./index');

var args = process.argv.slice(2);
var port = 8934;
var host = 'localhost';

// Accept: [port] or --port <n> --host <h> or any combination
for (var i = 0; i < args.length; i++) {
    if      (args[i] === '--port' && args[i + 1]) { port = Number(args[++i]); }
    else if (args[i] === '--host' && args[i + 1]) { host = args[++i]; }
    else if (/^\d+$/.test(args[i]))               { port = Number(args[i]); }  // positional port
}

var server = createBlink1Server({
    apiConfig: { port: port, host: host },
});

server.on('status', function(s) {
    console.log('[' + s.type + '] ' + s.source + ': ' + s.text);
});
server.on('deviceUpdated', function() {
    console.log('[info] device list updated');
});

server.start();
console.log('node-blink1-server listening on ' + host + ':' + port);

process.on('SIGINT',  function() { server.stop(function() { process.exit(0); }); });
process.on('SIGTERM', function() { server.stop(function() { process.exit(0); }); });
