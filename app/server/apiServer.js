"use strict";

var express   = require('express');
var tinycolor = require('tinycolor2');

var config = require('../configuration');
var log = require('../logger');
var Eventer = require('../eventer');

var Blink1Service = require('./blink1Service');
var PatternsService = require('./patternsService');

var app = express();
app.set('json spaces', 2);
var myLogger = function (req, res, next) {
  // log.msg("ApiServer", req.url);
  Eventer.addStatus( {type:'info', source:'api', id:req.ip, text:req.url} );
  next();
};
app.use(myLogger);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function (req, res) {
    res.send("Blink1Control2 API server\n\n");
});
app.get('/blink1(/id)?', function(req,res) {
    res.json({
        blink1_serialnums: Blink1Service.getAllSerials(),
        blink1_id: Blink1Service.getIftttKey(),
        status: "blink1 id"
    });
});
app.get('/blink1/off', function(req,res) {
    var blink1_id = Number(req.query.blink1_id);
    PatternsService.stopAllPatterns();
    Blink1Service.fadeToColor(0.1, '#000000', 0, blink1_id); // turn off everyone
    res.json({
        status: "blink1 off"
    });
});
app.get('/blink1/on', function(req,res) {
    var blink1_id = Number(req.query.blink1_id);
    PatternsService.stopAllPatterns();
    Blink1Service.fadeToColor(0.1, '#ffffff', 0, blink1_id); // turn off everyone
    res.json({
        status: "blink1 on"
    });
});
app.get('/blink1/fadeToRGB', function(req, res) {
    var color = tinycolor(req.query.rgb);
    var secs = Number(req.query.time) || 0.1;
    var ledn = Number(req.query.ledn) || 0;
    var blink1_id = Number(req.query.blink1_id);  // undefined means all blink1 devices

    // var blink1_id = req.query.blink1_id || '';
    var status = "success";

    if( color.isValid() ) {
        status = Blink1Service.fadeToColor( secs*1000, color, ledn, blink1_id );
    }
    else {
        status = "bad hex color specified " + req.query.rgb;
    }
    res.json( {
        // blink1Connected: blink1 !== null,
        blink1Serials: Blink1Service.getAllSerials(),
        lastColor: color.toHexString(),
        lastTime: secs,
        lastLedn: ledn,
        cmd: "fadeToRGB",
        status: status
    });
});

app.get('/blink1/lastColor', function(req, res) {
  var status = "success";
  var ledn = Number(req.query.ledn) || 0;
  var blink1_id = Number(req.query.blink1_id) || 0;  // undefined means all blink1 devices

  var color = Blink1Service.getCurrentColor(blink1_id, ledn);

  res.json( {
      blink1Serials: Blink1Service.getAllSerials(),
      lastColor: color.toHexString(),
      // lastTime: secs,
      lastLedn: ledn,
      cmd: "lastColor",
      status: status
  });
});

app.get('/blink1/pattern(s)?', function(req,res) {
    res.json({
        status: "pattern results",
        patterns: PatternsService.getAllPatternsForOutput()
    });
});
app.get('/blink1/pattern/list', function(req,res) {
    res.json({
        status: "pattern results",
        patterns: PatternsService.getAllPatternsForOutput()
    });
});
app.get('/blink1/pattern/queue', function(req,res) {
    res.json({
        status: "pattern queue results",
        // patterns: PatternsService.getAllPatternsForOutput()
        queue: PatternsService.getPlayingQueueForOutput()
    });
});

app.get('/blink1/pattern/:type(play|stop)', function(req,res) {
    var status = 'pattern '+req.params.type+': no pattern with that name';
    var patt_name = req.query.pname || req.query.name || '';
    var blink1_id = req.query.blink1_id || 0;

    if( req.params.type === 'play' ) {
        if( patt_name ) {
            // returns true on found pattern // FIXME: go back to using 'findPattern'
            if( PatternsService.playPatternFrom( 'api', patt_name, blink1_id ) ) {
                status = 'pattern play: playing ' +patt_name;
            }
        }
    }
    else { // stop
        if( !patt_name ) {
            PatternsService.stopAllPatterns();
            status = 'pattern stop: stopping all patterns';
        }
        else {
            var id = PatternsService.getIdForName( patt_name );
            if( !id ) { id = patt_name; }

            if( PatternsService.stopPattern( id ) ) {
                status = 'pattern stop: stopping ' +patt_name;
            }
        }
    }

    res.json({
        // id: patt_id,
        status: status,
        pname: patt_name,
        blink1_id: blink1_id
    });
});
app.get('/blink1/pattern/add', function(req,res) {
    var status = 'pattern add: no pattern added';
    var patt_name = req.query.pname || req.query.name || '';
    var pattout = '';
    if( ! patt_name && ! req.query.pattern ) {
        status = "must specify 'name' and 'pattern' string";
    }
    else {
        var patt = PatternsService.newPatternFromString( patt_name, req.query.pattern);
        if( patt ) { PatternsService.savePattern(patt); }
        pattout = PatternsService.formatPatternForOutput(patt);
        status = "pattern add: pattern '"+patt_name+"' added";
    }
    res.json({
        pattern: pattout,
        status: status
    });
});
app.get('/blink1/pattern/del', function(req,res) {
    var status = 'pattern del: no pattern deleted';
    var patt_name = req.query.pname || req.query.name || ''; // hmmmm
    var id = req.query.id || '';
    if( patt_name ) {
        id = PatternsService.getIdForName( patt_name );
        if( !id ) { id = patt_name; }
    }
    if( id ) {
        PatternsService.deletePattern( id );
        status = "pattern '"+id+"' deleted";
    }
    else {
        status = "must specify 'name' or 'id'";
    }
    res.json({
        status: status
    });
});
//
app.get('/blink1/input', function(req,res) {
    var status = 'event inputs';
    var rules = config.readSettings('eventRules');
    res.json({
        status: status,
        inputs: rules
    });
});

var apiServer = {
    server: null,
    config: {},
    // init: function() { // FIXME: bad name
    // 	// config.saveSettings("apiServer:port",8934);
    // 	// config.saveSettings("apiServer:enabled", false);
    // 	// config.saveSettings("apiServer:host", 'localhost');
    // },

    reloadConfig: function() {
        this.stop();
        this.start();
    },

    start: function() {
        this.config = config.readSettings('apiServer');
        if( !this.config ) { // if no config, make sensible defaults & save them
            this.config = {};
            this.config.port = 8934;
            this.config.host = 'localhost';
            this.config.enabled = false;
            config.saveSettings('apiServer', this.config);
        }
        if( !this.config.enabled ) {
            return;
        }
        var port = this.config.port || 8934;
        var host = this.config.host || 'localhost';
        if( host === 'any' ) {
            this.server = app.listen(port);
        }
        else {
            this.server = app.listen( port, host );
        }
    },

    stop: function() {
        if( this.server ) {
            this.server.close();
        }
        // config.saveSettings("apiServer:enabled", false);
    },

};

module.exports = apiServer;
