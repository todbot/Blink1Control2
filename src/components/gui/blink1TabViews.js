"use strict";

var React = require('react');
// var TabbedArea = require('react-bootstrap').TabbedArea;
// var TabPane = require('react-bootstrap').TabPane;
var Tabs = require('react-bootstrap').Tabs;
var Tab = require('react-bootstrap').Tab;
// var Panel = require('react-bootstrap').Panel;
// var Well = require('react-bootstrap').Well;

var BigButtonSet = require('./bigButtonSet');
var IftttTable = require('./iftttTable');
var MailTable = require('./mailTable');
var ToolTable = require('./toolTable');


var Blink1TabViews = React.createClass({

	render: function() {
		console.log("blink1TabViews.render");

		return (
				<div style={{width:720}}>
					<Tabs defaultActiveKey={1}>
						<Tab eventKey={1} title={<i className="fa fa-long-arrow-right"> <b>Start</b></i>}>
							<div style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								<BigButtonSet />
							</div>
						</Tab>
						<Tab eventKey={2} title={<i className="fa fa-plug"> Event Sources</i>}>
							<div style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								<ToolTable />
							</div>
						</Tab>
						<Tab eventKey={5} title={<i className="fa fa-life-ring"> Help</i>}>
							<div style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								Help goes here
							</div>
						</Tab>
					</Tabs>
				</div>
		);
	}


});

module.exports = Blink1TabViews;
