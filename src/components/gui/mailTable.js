"use strict";

var React = require('react');

var Table = require('react-bootstrap').Table;


var mailTable = React.createClass({

	propTypes: { 
		//events: React.PropTypes.array.isRequired,
		//onClear: React.PropTypes.func.isRequired
	},

	getInitialState: function() {
		return {
			events: [ 
				{ date: 1234, text: "this happened"},
				{ date: 1235, text: "this other thing happened"}
			]
		};
	},

	render: function() {
		var createRow = function() {
			
		};
		return (

			<Table bordered condensed hover>
				<tbody>
					<tr><td> Bob </td></tr>
					<tr><td> Bobasdfad </td></tr>
					<tr><td> Bobadfas </td></tr>
					<tr><td> asdfasdfBob </td></tr>
					<tr><td> Boadfadsfb </td></tr>
				</tbody>
			</Table>
        );

	}


});

module.exports = mailTable; 