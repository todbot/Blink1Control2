"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;
//var Glyphicon = require('react-bootstrap').Glyphicon;

var Blink1Status = require('./blink1Status');
var EventList = require('./eventList');
var PatternList = require('./patternList');

var Blink1TabViews = require('./blink1TabViews');
var Blink1ColorPicker = require('./blink1ColorPicker');


var Blink1ControlView = React.createClass({

	getInitialState: function() {
		return {
		};
	},

	render: function() {

		return (
			<div style={{ width: 1200, height: 700, background: "#f5f5f5", marginn: 0, padding: 10,
						WebkitUserSelect: "none" }}>
			<Grid fluid>
				<Row>
					<Col md={3}>
						<Blink1Status />
						<EventList />
					</Col>
					<Col md={9}>
						<Grid fluid>
						<Row>
							<Blink1TabViews />
						</Row>
						<Row>
							<Panel style={{width: 350, height: 350, margin: 5, display: "inline-block", verticalAlign: "top"}}>
								<Blink1ColorPicker />
							</Panel>
							<Panel style={{width: 350, height: 370, margin: 5, display: "inline-block", overflow: "scroll" }}>
								<PatternList />
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
