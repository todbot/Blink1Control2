"use strict";

var React = require('react');
var TabbedArea = require('react-bootstrap').TabbedArea;
var TabPane = require('react-bootstrap').TabPane;
var Panel = require('react-bootstrap').Panel;
var Well = require('react-bootstrap').Well;

var BigButtonSet = require('./bigButtonSet');
var IftttTable = require('./iftttTable');
var MailTable = require('./mailTable');


var Blink1TabViews = React.createClass({

	render: function() {
		console.log("blink1TabViews.render");

		return (
				<div>
					<TabbedArea>
						<TabPane eventKey={1} tab={<i className="fa fa-long-arrow-right"> Start</i>}>
							<div style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								<BigButtonSet />
							</div>
						</TabPane>
						<TabPane eventKey={2} tab={<i className="fa fa-plug"> IFTTT </i>}>
							<div style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								<IftttTable />
							</div>
						</TabPane>
						<TabPane eventKey={3} tab={<i className="fa fa-wrench"> Tools</i>}>
							<Panel style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
							Tools go here
							</Panel>
						</TabPane>
						<TabPane eventKey={4} tab={<i className="fa fa-envelope"> Mail</i>}>
							<Panel style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								<MailTable />
							</Panel>
						</TabPane>
						<TabPane eventKey={5} tab={<i className="fa fa-life-ring"> Help</i>}>
							<Panel style={{height: 200, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"}}>
								Help goes here
							</Panel>
						</TabPane>
					</TabbedArea>
				</div>
		);
	}


});

module.exports = Blink1TabViews;
