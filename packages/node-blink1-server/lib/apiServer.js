"use strict";

var express   = require('express');
var tinycolor = require('tinycolor2');
var utils     = require('./utils');

// Injected dependencies — set via init(). Defaults are silent no-ops.
var _log     = { msg: function() {}, warn: console.warn, error: console.error };
var _eventer = { addStatus: function() {} };
var _blink1  = null;
var _patt    = null;

var app = express();
app.set('json spaces', 2);
app.set("query parser", function(queryString) { return new URLSearchParams(queryString); });

var myLogger = function(req, res, next) {
    _eventer.addStatus({ type: 'info', source: 'api', id: req.ip, text: req.url });
    next();
};
app.use(myLogger);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

function getQueryMillis(req, defaultMillis) {
    if (req.query.get('millis')) { return Number(req.query.get('millis')); }
    if (req.query.get('time'))   { return Number(req.query.get('time')) * 1000; }
    return defaultMillis;
}
function getQueryBlink1Id(req) {
    return req.query.get('blink1_id') || req.query.get('id') || undefined;
}

app.get('/', function(req, res) {
    res.send("node-blink1-server API\n\n");
});

app.get('/blink1(/id)?', function(req, res) {
    res.json({ blink1_serialnums: _blink1.getAllSerials(), blink1_id: _blink1.getIftttKey(), status: "blink1 id" });
});

app.get('/blink1/enumerate', function(req, res) {
    _blink1.reloadConfig();
    res.json({ blink1_serialnums: _blink1.getAllSerials(), blink1_id: _blink1.getIftttKey(), status: "blink1 enumerate" });
});

app.get('/blink1/off', function(req, res) {
    var blink1_id = getQueryBlink1Id(req);
    _patt.stopAllPatterns();
    _blink1.fadeToColor(100, '#000000', 0, blink1_id);
    res.json({ status: "blink1 off", rgb: '#000000' });
});

app.get('/blink1/on', function(req, res) {
    var blink1_id = getQueryBlink1Id(req);
    _patt.stopAllPatterns();
    _blink1.fadeToColor(100, '#ffffff', 0, blink1_id);
    res.json({ status: "blink1 on", rgb: '#ffffff' });
});

var namedColors = { red: '#ff0000', green: '#00ff00', blue: '#0000ff', cyan: '#00ffff', yellow: '#ffff00', magenta: '#ff00ff' };
app.get('/blink1/:color(red|green|blue|cyan|yellow|magenta)', function(req, res) {
    var hex      = namedColors[req.params.color];
    var millis   = getQueryMillis(req, 100);
    var ledn     = Number(req.query.get('ledn')) || 0;
    var blink1_id = getQueryBlink1Id(req);
    _patt.stopAllPatterns();
    _blink1.fadeToColor(millis, hex, ledn, blink1_id);
    res.json({ status: 'blink1 ' + req.params.color, rgb: hex });
});

app.get('/blink1/blink', function(req, res) {
    var color    = tinycolor(req.query.get('rgb') || '#ffffff');
    if (!color.isValid()) { color = tinycolor('#ffffff'); }
    var count    = Number(req.query.get('count')) || 3;
    var millis   = getQueryMillis(req, 500);
    var blink1_id = getQueryBlink1Id(req);
    var hex      = color.toHexString();
    _patt.playPatternFrom('api', '~blink:' + hex + '-' + count + '-' + (millis / 1000), blink1_id);
    res.json({ status: 'blink1 blink', rgb: hex, count: count, millis: millis });
});

app.get('/blink1/random', function(req, res) {
    var hex      = utils.generateRandomHexColor();
    var millis   = getQueryMillis(req, 100);
    var ledn     = Number(req.query.get('ledn')) || 0;
    var blink1_id = getQueryBlink1Id(req);
    _blink1.fadeToColor(millis, hex, ledn, blink1_id);
    res.json({ status: 'blink1 random', rgb: hex });
});

app.get('/blink1/fadeToRGB', function(req, res) {
    var color    = tinycolor(req.query.get('rgb'));
    var millis   = getQueryMillis(req, 100);
    var ledn     = Number(req.query.get('ledn')) || 0;
    var blink1_id = getQueryBlink1Id(req);
    var status   = color.isValid() ? _blink1.fadeToColor(millis, color, ledn, blink1_id) : "bad hex color specified " + req.query.get('rgb');
    if (!status) { status = "success"; }
    res.json({ blink1_serialnums: _blink1.getAllSerials(), lastColor: color.toHexString(), lastTime: millis / 1000, lastMillis: millis, lastLedn: ledn, cmd: "fadeToRGB", status: status });
});

app.get('/blink1/lastColor', function(req, res) {
    var ledn     = Number(req.query.get('ledn')) || 0;
    var blink1_id = getQueryBlink1Id(req);
    var color    = _blink1.getCurrentColor(blink1_id, ledn);
    res.json({ blink1_serialnums: _blink1.getAllSerials(), lastColor: color.toHexString(), lastLedn: ledn, cmd: "lastColor", status: "success" });
});

app.get('/blink1/pattern(s)?', function(req, res) {
    res.json({ status: "pattern results", patterns: _patt.getAllPatternsForOutput() });
});

app.get('/blink1/pattern/queue', function(req, res) {
    res.json({ status: "pattern queue results", queue: _patt.getPlayingQueueForOutput() });
});

app.get('/blink1/pattern/:type(play|stop)', function(req, res) {
    var status    = 'pattern ' + req.params.type + ': no pattern with that name';
    var patt_name = req.query.get('pname') || req.query.get('name') || '';
    var blink1_id = getQueryBlink1Id(req);
    if (req.params.type === 'play') {
        if (patt_name && _patt.playPatternFrom('api', patt_name, blink1_id)) {
            status = 'pattern play: playing ' + patt_name;
        }
    } else {
        if (!patt_name) {
            _patt.stopAllPatterns();
            status = 'pattern stop: stopping all patterns';
        } else {
            var id = _patt.getIdForName(patt_name) || patt_name;
            if (_patt.stopPattern(id)) { status = 'pattern stop: stopping ' + patt_name; }
        }
    }
    res.json({ status: status, pname: patt_name, blink1_id: blink1_id });
});

app.get('/blink1/pattern/add', function(req, res) {
    var status    = 'pattern add: no pattern added';
    var patt_name = req.query.get('pname') || req.query.get('name') || '';
    var pattout   = '';
    if (!patt_name && !req.query.get('pattern')) {
        status = "must specify 'name' and 'pattern' string";
    } else {
        var patt = _patt.newPatternFromString(patt_name, req.query.get('pattern'));
        _log.msg("patt:", patt, req.query.get('pattern'));
        if (patt) {
            _patt.savePattern(patt);
            pattout = _patt.formatPatternForOutput(patt);
            status  = "pattern add: pattern '" + patt_name + "' added";
        } else {
            _log.msg("PatternsService: bad pattern specified:", patt_name);
        }
    }
    res.json({ pattern: pattout, status: status });
});

app.get('/blink1/pattern/del', function(req, res) {
    var status    = 'pattern del: no pattern deleted';
    var patt_name = req.query.get('pname') || req.query.get('name') || '';
    var id        = req.query.get('id') || '';
    if (patt_name) { id = _patt.getIdForName(patt_name) || patt_name; }
    if (id) { _patt.deletePattern(id); status = "pattern '" + id + "' deleted"; }
    else    { status = "must specify 'name' or 'id'"; }
    res.json({ status: status });
});

app.get('/blink1/input*', function(req, res) {
    res.json({ status: "event inputs disclosure no longer supported" });
});

var apiServer = {
    server: null,
    config: { port: 8934, host: 'localhost' },

    init: function(services) {
        if (services.blink1Service)   { _blink1  = services.blink1Service; }
        if (services.patternsService) { _patt    = services.patternsService; }
        if (services.log)             { _log     = services.log; }
        if (services.eventer)         { _eventer = services.eventer; }
    },

    reloadConfig: function(apiConfig, cb) {
        var self = this;
        self.stop(function() {
            if (apiConfig) { self.config = apiConfig; }
            self.start();
            if (cb) { cb(); }
        });
    },

    start: function(apiConfig) {
        if (apiConfig) { this.config = apiConfig; }
        var port = this.config.port || 8934;
        var host = this.config.host || 'localhost';
        if (host === 'any' || host === '0.0.0.0') {
            this.server = app.listen(port);
        } else {
            this.server = app.listen(port, host);
        }
        this.server.on('error', function(err) {
            if (err.code === 'EADDRINUSE') {
                _log.msg("ApiServer: port", port, "already in use");
                _eventer.addStatus({ type: 'error', source: 'api', id: 'apiServer', text: 'port ' + port + ' already in use' });
            } else {
                _log.msg("ApiServer error:", err.message);
                _eventer.addStatus({ type: 'error', source: 'api', id: 'apiServer', text: err.message });
            }
        });
    },

    stop: function(cb) {
        if (this.server) {
            // closeAllConnections() (Node 18.2+) terminates keep-alive connections
            // so that close() can invoke its callback immediately rather than hanging.
            if (this.server.closeAllConnections) { this.server.closeAllConnections(); }
            this.server.close(function() { if (cb) cb(); });
            this.server = null;
        } else {
            if (cb) { cb(); }
        }
    },
};

module.exports = apiServer;
