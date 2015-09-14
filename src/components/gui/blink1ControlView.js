"use strict";

var React = require('react');
var Well = require('react-bootstrap').Well;
var Panel = require('react-bootstrap').Panel;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
var TabbedArea = require('react-bootstrap').TabbedArea;
var TabPane = require('react-bootstrap').TabPane;
var Glyphicon = require('react-bootstrap').Glyphicon;
//var ButtonGroup = require('react-bootstrap').ButtonGroup;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var ColorPicker = require('react-color');
var colorparse = require('parse-color');

var PatternsApi = require('../../api/patternsApi');

var DeviceSummary = require('./deviceSummary');
var EventList = require('./eventList');
var PatternList = require('./patternList');
var BigButton = require('./bigButton');

var remote = window.require('remote');
var HID = remote.require('node-hid');
var Blink1 = remote.require('node-blink1');

var blink1devices = Blink1.devices();

var blink1;

function blink1Fade( millis, r, g, b ) {
	if( blink1devices.length ) {
		blink1 = new Blink1();  // if we do this with no blink1, get error we can't catch
		blink1.fadeToRGB( millis, r, g, b);
		blink1.close();
	}
}
//console.log("blink1 devices!!!!!: ", JSON.stringify(blink1devices));

var title = (
	<h1> Blink1Control </h1>
	);

var Blink1ControlView = React.createClass({

	getInitialState: function() {
		return {
			blink1Color: "#33dd33",
			status: "not connected",
			serialNumber: "1234abcd",
			iftttKey: "abbaabba1234abcd",
			currentPattern: "no potato for you",
			events: [ 
				{ date: 1234, text: "this happened"},
				{ date: 1235, text: "this other thing happened"}
			],
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
			],
			patterns: PatternsApi.getAllPatterns()
		};
	},

	setBlink1Color: function(colorstr) {
		this.setState( {blink1Color: colorstr} );
		var color = colorparse( colorstr ); // FIXME: must be better way
		console.log("setBlink1Color: colorstr:", colorstr ); //, " : ", color);
		blink1Fade( 200, color.rgb[0], color.rgb[1], color.rgb[2]);
	},

	clearEvents: function() {
		this.setState({events: []});
	},

	addBigButton: function() { // FIXME: this is hacky
		this.state.buttonsUser.push( {name: "BigButton", type: "color", color: this.state.blink1Color});
		this.setState( {buttonsUser: this.state.buttonsUser });
	},

	playBigButton: function(buttontype, buttonindex) {
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
	handleColorPicker: function(color) {
		this.setBlink1Color( "#" + color.hex );  // FIXME: there must be better way
		return true;  // FIXME: need this?
	},
	handlePatternChange: function(pattern) {
		console.log("handlePatternChange: ", pattern);
	},

	render: function() {

		var createPatternView = function(pattern) {
			return (
				<li>patt:{pattern.id} : {pattern.name} : {pattern.patternstr}</li>
			);
		};
		var createBigButton = function(button, index) {
			return (
				<BigButton key={index} name={button.name} type={button.type} color={button.color} 
				onClick={this.playBigButton.bind(this, button.type, index)} />
			);
		};

		return (
			<div style={{ width: 1000, height: 700, background: "#f5f5f5", marginn: 0, padding: 10, 
						WebkitUserSelect: "none" }}>
			<Grid fluid>
				<Row>
					<Col md={4} >
						<DeviceSummary blink1Color={this.state.blink1Color} 
										status={this.state.status}
										serialNumber={this.state.serialNumber}
										iftttKey={this.state.iftttKey}
										pattern={this.state.currentPattern} />
						<EventList events={this.state.events} onClear={this.clearEvents} />
					</Col>
					<Col md={8}>
						<Grid fluid>
						<Row>
						<TabbedArea >
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
									IFTTT goes here
								</Panel>
							</TabPane>
							<TabPane eventKey={3} tab={<i className="fa fa-wrench"> Tools</i>}>
								<Panel style={{height: 200}}>
								Tools go here
								</Panel>
							</TabPane>
							<TabPane eventKey={4} tab={<i className="fa fa-envelope"> Mail</i>}>
								<Panel style={{height: 200}}>
									Mail goes here
								</Panel>
							</TabPane>
							<TabPane eventKey={5} tab={<i className="fa fa-life-ring"> Help</i>}>
								<Panel style={{height: 200}}>
									Mail goes here
								</Panel>
							</TabPane>
						</TabbedArea>
						</Row>
						<Row>
							<Panel style={{width: 250, height: 350, margin: 5, display: "inline-block", verticalAlign: "top"}}>
								<ColorPicker type="sketch" color={this.state.blink1Color} onChange={this.handleColorPicker} />
							</Panel>
							<Panel style={{width: 350, height: 370, margin: 5, display: "inline-block", overflow: "scroll" }}>
								<PatternList patterns={this.state.patterns} onPatternChange={this.handlePatternChange} />
							</Panel>
						</Row>
						</Grid>
					</Col>
				</Row>
			</Grid>
			</div>
			);
	}
});

module.exports = Blink1ControlView; 