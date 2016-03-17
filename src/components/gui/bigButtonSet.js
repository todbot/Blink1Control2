"use strict";

var React = require('react');

var config = require('../../configuration');
var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
//var MenuItem = require('react-bootstrap').MenuItem;

var BigButton = require('./bigButton');


var buttonsUserDefault = [
    { name: "Available", type: "color", color: "#00FF00", ledn: 0 },
    { name: "Busy", type: "color", color: "#ffFF00", ledn: 0},
    { name: "Away", type: "color", color: "#ff0000", ledn: 0 }
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
        this.setState( {buttonsUser: buttonsUser });
        config.saveSettings("bigButtons", buttonsUser);
    },
    addBigButton: function() { // FIXME: this is hacky
        var newbut = {
            name: "Big Button",
            type: "color",
            color: Blink1Service.getCurrentColor().toHexString(),
            ledn: Blink1Service.getCurrentLedN()
        };
        console.log("newbut", newbut);
        this.state.buttonsUser.push( newbut );
        this.saveButtons( this.state.buttonsUser );
    },
    onEditButton: function(cmd, idx) {
        console.log('onEditButton:', cmd, idx);
        if( cmd === 'delete' ) {
            delete this.state.buttonsUser[ idx ];
        }
        else if( cmd === 'moveleft') {
            if( idx > 0 ) {
                var tmpbutton = this.state.buttonsUser[idx-1];
                this.state.buttonsUser[idx-1] = this.state.buttonsUser[idx];
                this.state.buttonsUser[idx] = tmpbutton;
            }
        }
        else if( cmd === 'setcolor') {
            this.state.buttonsUser[idx].type = 'color';
            this.state.buttonsUser[idx].color = Blink1Service.getCurrentColor().toHexString();
            this.state.buttonsUser[idx].ledn = Blink1Service.getCurrentLedN();
        }
        else if( cmd === 'setpattern') {
            this.state.buttonsUser[idx].type = 'pattern';
            this.state.buttonsUser[idx].patternId = PatternsService.getPlayingPatternId();
        }
        this.saveButtons( this.state.buttonsUser );
    },
    // internal function used by differnt kinds of buttons
    setBlink1Color: function(color, ledn) {
        console.log("BigButtonSet.setBlink1Color:",color);
        ledn = ledn || 0; // 0 means all
        Blink1Service.fadeToColor( 100, color, ledn );  // FIXME: millis
    },
    playPattern: function(patternid) {
        PatternsService.playPattern( patternid );
    },

	playBigButton: function(buttontype, buttonindex) {
		console.log("playBigButton:", buttontype, buttonindex);
		if( buttontype === 'sys' ) {
			var butt = this.state.buttonsSys[buttonindex];
			console.log("system button parsing goes here");
			if( butt.name === "White" ) {
				this.setBlink1Color( "#FFFFFF" );
			}
			else if( butt.name === "Off" ) {
				this.setBlink1Color( "#000000" );
                PatternsService.stopAllPatterns();
			}
		}
		else if( buttontype === 'color' ) {
            console.log("buttontype color");
			this.setBlink1Color( this.state.buttonsUser[buttonindex].color, this.state.buttonsUser[buttonindex].ledn );
		}
        else if( buttontype === 'pattern' ) {
            this.playPattern( this.state.buttonsUser[buttonindex].patternId );
        }
	},

    render: function() {
        var createBigButtonSys = function(button, index) { // FIXME: understand bind()
            return (
                <BigButton key={index} name={button.name} type='sys'
                    onClick={this.playBigButton.bind(null, 'sys', index)} idx={index} />
            );
        };
        var createBigButtonUser = function(button, index) { // FIXME: understand bind()
            return (
                <BigButton key={index} name={button.name} type={button.type} color={button.color}
                    onClick={this.playBigButton.bind(null, button.type, index)} idx={index}
                    onEdit={this.onEditButton} />
            );
        };
        return (
            <div>
                <ButtonToolbar style={{padding: 10}}>
                    {this.state.buttonsSys.map(createBigButtonSys, this)}
                </ButtonToolbar>
                <div style={{padding: 10, overflowX: 'auto', overflowY:'hidden'}}>
                <ButtonToolbar style={{width:1500}}>
                    {this.state.buttonsUser.map(createBigButtonUser, this)}
                    <BigButton key="add" name="add" type="add" onClick={this.addBigButton} />
                </ButtonToolbar>
                </div>
            </div>
        );
    }
});

module.exports = BigButtonSet;
