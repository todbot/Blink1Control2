"use strict";

var React = require('react');
var remote = window.require('remote');

var Blink1Api = remote.require('./src/server/blink1ServerApi');
//var PatternsApi = require('../../api/patternsApi');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
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
        this.state.buttonsUser.push( {name: "BigButton", type: "color", color: this.state.blink1Color});
        this.setState( {buttonsUser: this.state.buttonsUser });
    },
    setBlink1Color: function(color) {
        console.log("setBlink1Color:", color);
        Blink1Api.fadeToColor( 100, color );
    },
    playPattern: function(patternid) {
        console.log("playPattern:", patternid);
        //PatternsApi.playPattern( patternid );
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
			this.setBlink1Color( this.state.buttonsUser[buttonindex].color );
		}
        else if( buttontype === 'pattern' ) {
            this.playPattern( this.state.buttonsUser[buttonindex].patternId );
        }
	},

  render: function() {
    var createBigButton = function(button, index) {
      return (
        <BigButton key={index} name={button.name} type={button.type} color={button.color}
        onClick={this.playBigButton.bind(null, button.type, index)} />
      );
    };

    return (
      <div>
      <div style={{padding: 10}}>
        <ButtonToolbar>
          {this.state.buttonsSys.map(createBigButton, this)}
        </ButtonToolbar>
      </div>
      <div style={{padding: 10}}>
        <ButtonToolbar>
          {this.state.buttonsUser.map(createBigButton, this)}
        <BigButton key="add" name="add" type="add" onClick={this.addBigButton} />
        </ButtonToolbar>
      </div>
      </div>
    );
  }

});

module.exports = BigButtonSet;
