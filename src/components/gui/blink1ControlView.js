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
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var ColorPicker = require('react-color');
var colorparse = require('parse-color');

var VirtualBlink1 = require('./VirtualBlink1');
var EventList = require('./eventList');
var PatternList = require('./patternList');
var BigButton = require('./bigButton');

var IftttTable = require('./iftttTable');
var MailTable = require('./mailTable');

var PatternsApi = require('../../api/patternsApi');
var Blink1Api = require('../../api/Blink1DeviceApi');


var Blink1ControlView = React.createClass({

	getInitialState: function() {
		return {
			blink1Color: "#33dd33",
			statusStr: Blink1Api.isConnected() ? "connected" : "not connected",
			serialNumber: Blink1Api.serialNumberForDisplay(),
			iftttKey: Blink1Api.iftttKey(),
			currentPattern: "no potato for you",
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
			//patterns: PatternsApi.getAllPatterns()
		};
	},

	setBlink1Color: function(colorstr) {
		this.setState( {blink1Color: colorstr} );
		var color = colorparse( colorstr ); // FIXME: must be better way
		//console.log("setBlink1Color: colorstr:", colorstr ); //, " : ", color);
		Blink1Api.fadeToRGB( 200, color.rgb[0], color.rgb[1], color.rgb[2]);
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
					<Col md={4}>
						<Panel header="Device" style={{ width: 280, height: 360}}>
							<div style={{ width: 256, height: 192, margin: "auto" }}>
							<VirtualBlink1 blink1Color={this.state.blink1Color} />
							</div>
							<Well bsSize="small">
								<div> Status: <b>{this.state.statusStr}</b> </div>
								<div> Serial number: <code>{this.state.serialNumber}</code> <br />
										IFTTT Key: <code>{this.state.iftttKey} </code></div>
								<div> Pattern: <b> {this.props.currentPattern}</b></div>
							</Well>
						</Panel>
						<EventList />
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
						</Row>
						<Row>
							<Panel style={{width: 250, height: 350, margin: 5, display: "inline-block", verticalAlign: "top"}}>
								<ColorPicker type="sketch" color={this.state.blink1Color} onChange={this.handleColorPicker} />
							</Panel>
							<Panel style={{width: 350, height: 370, margin: 5, display: "inline-block", overflow: "scroll" }}>
								<PatternList onPatternChange={this.handlePatternChange} />
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