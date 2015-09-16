"use strict";

var React = require('react');
var TabbedArea = require('react-bootstrap').TabbedArea;
var TabPane = require('react-bootstrap').TabPane;
var Panel = require('react-bootstrap').Panel;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;


var IftttTable = require('./iftttTable');
var MailTable = require('./mailTable');
var BigButton = require('./bigButton');

var Blink1Api = require('../../api/Blink1DeviceApi');

var Blink1TabViews = React.createClass({

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
	},


	render: function() {
		console.log("blink1TabViews.render");

		var createBigButton = function(button, index) {
			return (
				<BigButton key={index} name={button.name} type={button.type} color={button.color} 
				onClick={this.playBigButton.bind(null, button.type, index)} />
			);
		};

		return (
				<div>
					<TabbedArea>
						<TabPane eventKey={1} tab={<i className="fa fa-long-arrow-right"> Start</i>}>
							<Panel style={{height: 200}}>
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
							</Panel>
						</TabPane>
						<TabPane eventKey={2} tab={<i className="fa fa-plug"> IFTTT </i>}>
							<Panel style={{height: 200}}>
								<IftttTable />
							</Panel>
						</TabPane>
						<TabPane eventKey={3} tab={<i className="fa fa-wrench"> Tools</i>}>
							<Panel style={{height: 200}}>
							Tools go here
							</Panel>
						</TabPane>
						<TabPane eventKey={4} tab={<i className="fa fa-envelope"> Mail</i>}>
							<Panel style={{height: 200}}>
								<MailTable />
							</Panel>
						</TabPane>
						<TabPane eventKey={5} tab={<i className="fa fa-life-ring"> Help</i>}>
							<Panel style={{height: 200}}>
								Help goes here
							</Panel>
						</TabPane>
					</TabbedArea>
				</div>
		);
	}	


});

module.exports = Blink1TabViews; 
