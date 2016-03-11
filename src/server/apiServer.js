"use strict";

var express      = require('express');
var tinycolor = require('tinycolor2');

var config = require('../configuration');
var log = require('../logger');

var Blink1Service = require('./blink1Service');
var PatternsService = require('./patternsService');

var app = express();
app.set('json spaces', 2);
var myLogger = function (req, res, next) {
  log.msg("ApiServer", req.url);
  next();
};
app.use(myLogger);


app.get('/', function (req, res) {
	res.send('Blink1Control2 API server');
});
app.get('/blink1(/id)?', function(req,res) {
	res.json({
        blink1_serialnums: Blink1Service.getAllSerials(),
		blink1_id: Blink1Service.iftttKey(),
		status: "blink1 id"
    });
});
app.get('/blink1/off', function(req,res) {
    PatternsService.stopAllPatterns();
    Blink1Service.fadeToColor(0.1, '#000000', 0); // turn off everyone
    res.json({
        status: "blink1 off"
    });
});
app.get('/blink1/fadeToRGB', function(req, res) {
    var color = tinycolor(req.query.rgb);
    var secs = Number(req.query.time) || 0.1;
    var ledn = Number(req.query.ledn) || 0;
    var status = "success";

    if( color.isValid() ) {
        status = Blink1Service.fadeToColor( secs*1000, color, ledn );
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

app.get('/blink1/pattern(s)?', function(req,res) {
	res.json({
		status: "pattern results",
		patterns: PatternsService.getAllPatternsForOutput()
	});
});

app.get('/blink1/pattern/:type(play|stop)', function(req,res) {
	var patt_id = req.query.pname ;
	var status = 'no pattern with that id';
	if( req.params.type === 'play' ) {
		if( PatternsService.playPattern( patt_id ) ) { // returns true on found pattern // FIXME: go back to using 'findPattern'
			status = 'playing pattern ' +patt_id;
		}
	}
	else {
        if( !patt_id ) {
            PatternsService.stopAllPatterns();
            status = 'stopping all patterns';
        } else {
            if( PatternsService.stopPattern( patt_id ) ) {
			    status = 'stopping pattern ' +patt_id;
            }
		}
	}
	res.json({
		status: status
	});
});
app.get('/blink1/pattern/add', function(req,res) {
	var status = 'pattern add';
	if( ! req.query.name || ! req.query.pattern ) {
		status = "must specify 'name' and 'pattern' string";
	}
	var patt = PatternsService.newPatternFromString( req.query.pname, req.query.pattern);
	if( patt ) { PatternsService.savePattern(patt); }
	var pattout = PatternsService.formatPatternForOutput(patt);
	res.json({
		pattern: pattout,
		status: status
	});
});

//

var apiServer = {
	server: null,
    config: {},
	// init: function() { // FIXME: bad name
	// 	// config.saveSettings("apiServer:port",8934);
	// 	// config.saveSettings("apiServer:enabled", false);
	// 	// config.saveSettings("apiServer:host", 'localhost');
	// },

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
		this.server = app.listen( port );
	},

	stop: function() {
		if( this.server ) {
			this.server.close();
		}
		// config.saveSettings("apiServer:enabled", false);
	},

};

module.exports = apiServer;
