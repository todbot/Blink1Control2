"use strict";

var React = require('react');

var remote = window.require('remote');
var Blink1Api = remote.require('./src/server/blink1DeviceApi');
var PatternsApi = remote.require('./src/server/patternsApi');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
//var MenuItem = require('react-bootstrap').MenuItem;

var BigButton = require('./bigButton');

var BigButtonSet = React.createClass({
    getInitialState: function() {
        return {
            buttonsSys: [
                { name: "Color Cycle", type: "sys" },
                { name: "Mood Light", type: "sys" },
                { name: "Strobe Light", type: "sys" },
                { name: "White", type: "sys" },
                { name: "Off", type: "sys" }
            ],
            buttonsUser: [
                { name: "Available", type: "color", color: "#00FF00" },
                { name: "Busy", type: "color", color: "#ffFF00" },
                { name: "Away", type: "color", color: "#ff0000" },
                { name: "boop", type: "pattern", patternId: "purple-flashes" },
                { name: "Some Long Name", type: "color", color: "#336699" }
            ]
        };
    },
    addBigButton: function() { // FIXME: this is hacky
        var newbut = {name: "BigButton", type: "color", color: Blink1Api.getCurrentColor()};
        console.log("newbut", newbut);
        this.state.buttonsUser.push( newbut );
        this.setState( {buttonsUser: this.state.buttonsUser });
    },
    onEditButton: function(cmd, idx) {
        console.log('onEditButton:', cmd, idx);
        if( cmd === 'delete' ) {
            delete this.state.buttonsUser[ idx ];
        }
        else if( cmd === 'setcolor') {
            this.state.buttonsUser[idx].type = 'color';
            this.state.buttonsUser[idx].color = Blink1Api.getCurrentColor();
        }
        else if( cmd === 'setpattern') {
            this.state.buttonsUser[idx].type = 'pattern';
            this.state.buttonsUser[idx].patternId = PatternsApi.getPlayingPattern();
        }
        this.setState( {buttonsUser: this.state.buttonsUser });
    },
    setBlink1Color: function(color) {
        Blink1Api.fadeToColor( 100, color );
    },
    playPattern: function(patternid) {
        PatternsApi.playPattern( patternid );
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
			}
		}
		else if( buttontype === 'color' ) {
            console.log("buttontype color");
			this.setBlink1Color( this.state.buttonsUser[buttonindex].color );
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
                <div style={{padding: 10}}>
                    <ButtonToolbar>
                        {this.state.buttonsSys.map(createBigButtonSys, this)}
                    </ButtonToolbar>
                </div>
                <div style={{padding: 10}}>
                    <ButtonToolbar>
                        {this.state.buttonsUser.map(createBigButtonUser, this)}
                        <BigButton key="add" name="add" type="add" onClick={this.addBigButton} />
                    </ButtonToolbar>
                </div>
            </div>
        );
    }
});

module.exports = BigButtonSet;
