"use strict";

var React = require('react');

var config = require('../../configuration');
var log = require('../../logger');
var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
//var MenuItem = require('react-bootstrap').MenuItem;

var BigButton = require('./bigButton');


var buttonsUserDefault = [
    { name: "Available", type: "color", color: "#00FF00", ledn: 0 },
    { name: "Busy", type: "color", color: "#ffFF00", ledn: 0},
    { name: "Away", type: "color", color: "#ff0000", ledn: 0 },
    { name: "Meeting", type: "color", color: "#00000ff", ledn: 0 }
];

var BigButtonSet = React.createClass({
    getInitialState: function() {
        var buttonsUser = config.readSettings('bigButtons');
        if( !buttonsUser ) {
            buttonsUser = buttonsUserDefault;
        }
        return {
            buttonsSys: [
                { name: "Color Cycle", type: "sys" },
                { name: "Mood Light", type: "sys" },
                { name: "Strobe Light", type: "sys" },
                { name: "White", type: "sys" },
                { name: "Off", type: "sys" }
            ],
            buttonsUser: buttonsUser
        };
    },
    saveButtons: function(buttonsUser) {
        // log.msg("BigButtonSet.saveButtons: buttonsUser:", JSON.stringify(buttonsUser));
        this.setState( {buttonsUser: buttonsUser });
        config.saveSettings("bigButtons", buttonsUser);
    },
    addBigButton: function() { // FIXME: this is hacky
        var newbut = {
            name: "Big Button "+this.state.buttonsUser.length,
            type: "color",
            color: Blink1Service.getCurrentColor().toHexString(),
            ledn: Blink1Service.getCurrentLedN()
        };
        var newbuttons = this.state.buttonsUser.concat( newbut );
        this.saveButtons( newbuttons );
    },
    onEdit: function(cmd, idx, arg) {
        var mybuttons = this.state.buttonsUser.concat(); // clone;
        // var editbutt = mybuttons[idx];
        if( cmd === 'delete' ) {
            // delete this.state.buttonsUser[ idx ];
            delete mybuttons[ idx ];
        }
        else if( cmd === 'moveleft') {
            if( idx > 0 ) {
                var tmpbutton = mybuttons[idx-1];
                mybuttons[idx-1] = mybuttons[idx];
                mybuttons[idx] = tmpbutton;
            }
        }
        else if( cmd === 'setcolor') {
            mybuttons[idx] = { name: mybuttons[idx].name,
                type:'color',
                color: Blink1Service.getCurrentColor().toHexString(),
                ledn: Blink1Service.getCurrentLedN()
            };
        }
        else if( cmd === 'setpattern') {
            mybuttons[idx] = { name: mybuttons[idx].name,
                type:'pattern',
                color: 'grey',
                patternId: arg
            };
        }
        else if( cmd === 'rename' ) {
            // this.state.buttonsUser[idx].name = arg;
            mybuttons[idx].name = arg;
        }
        this.saveButtons( mybuttons );
    },
    // internal function used by differnt kinds of buttons
    setBlink1Color: function(color, ledn) {
        // console.log("BigButtonSet.setBlink1Color:",color);
        ledn = ledn || 0; // 0 means all
        Blink1Service.fadeToColor( 100, color, ledn );  // FIXME: millis
    },
    playPattern: function(patternid) {
        PatternsService.playPattern( patternid );
    },

	playBigButton: function(buttontype, buttonindex) {
		// console.log("playBigButton:", buttontype, buttonindex);
        var button = this.state.buttonsUser[buttonindex];
		if( buttontype === 'sys' ) {
			button = this.state.buttonsSys[buttonindex];
			if( button.name === "White" ) {
				this.setBlink1Color( "#FFFFFF" );
			}
			else if( button.name === "Off" ) {
                PatternsService.stopAllPatterns();
                Blink1Service.off();
			}
            else if( button.name === "Color Cycle" ) {
                Blink1Service.toyStart('colorcycle');
            }
            else if( button.name === "Mood Light" ) {
                Blink1Service.toyStart('moodlight');
            }
            else if( button.name === "Strobe Light" ) {
                Blink1Service.toyStart('strobe');
                // PatternsService.playPattern( '~blink-white-0' );
            }
		}
		else if( buttontype === 'color' ) {
			this.setBlink1Color( button.color, button.ledn );
		}
        else if( buttontype === 'pattern' ) {
            this.playPattern( button.patternId );
        }
        log.addEvent({type:'trigger', source:'button', id:button.name, text:button.name} );
	},

    render: function() {
        var patterns = PatternsService.getAllPatterns();
        var serials = Blink1Service.getAllSerials();
        var createBigButtonSys = function(button, index) { // FIXME: understand bind()
            return (
                <BigButton key={index} name={button.name} type='sys'
                    onClick={this.playBigButton.bind(null, 'sys', index)} idx={index} />
            );
        };
        var createBigButtonUser = function(button, index) { // FIXME: understand bind()
            return (
                <BigButton key={index} idx={index} name={button.name} type={button.type}
                    color={button.color} patterns={patterns} serials={serials}
                    onClick={this.playBigButton.bind(null, button.type, index)}
                    onEdit={this.onEdit} />
            );
        };
        return (
            <div>
                <ButtonToolbar style={{padding: 10}}>
                    {this.state.buttonsSys.map(createBigButtonSys, this)}
                </ButtonToolbar>
                <div style={{padding: 10, overflowX: 'auto', overflowY:'hidden'}}>
                    <ButtonToolbar style={{width:1500}} ref="btbar">
                        {this.state.buttonsUser.map(createBigButtonUser, this)}
                        <BigButton key="add" name="add button" type="sys" onClick={this.addBigButton} />
                    </ButtonToolbar>
                </div>
            </div>
        );
    }
});

module.exports = BigButtonSet;
