"use strict";

var React = require('react');
var Button = require('react-bootstrap').Button;
var Dropdown = require('react-bootstrap').Dropdown;
var MenuItem = require('react-bootstrap').MenuItem;
var DropdownButton = require('react-bootstrap').DropdownButton;

var Pattern = require('./pattern');

var PatternList = React.createClass({
	propTypes: {
		patterns: React.PropTypes.array.isRequired,
		onPatternChange: React.PropTypes.func
	},

	handleRepeatsClick: function(pattern) {
		console.log("real handleRepeatsClick: ", pattern);
		//this.props.onPatternChange( pattern );
	},

	playPattern: function(e) { 
		console.log("playPattern: ", e);		
	},
	editPattern: function() {
		console.log("editPattern:");
	},
	lockPattern: function() {
		console.log("lockPattern:");
	},
	copyPattern: function() {
		console.log("copyPattern:");
	},
	deletePattern: function() {
		console.log("deletPattern:");
	},
	render: function() {

		var patternStyle = {
			borderStyle: "solid", borderWidth: 1, borderRadius: "4%", borderColor: "#eee", padding: 4,
			background: "#fff"
		};
		var createPattern = function(pattern) {
			var playButtStyle = {borderStyle: "none", background: "white", display: "inline", padding: 2 };
			var editButtStyle = {borderStyle: "none", background: "white", borderLeftStyle: "solid", float: "right", padding: 4 };
			var patternStateIcon = (pattern.playing) ? 'fa-stop' : 'fa-play';
			return (
				<div key={pattern.id} style={patternStyle} disabled={true}>
					<Button onClick={this.playPattern} bsSize="xsmall"><i className="fa fa-play"></i></Button>
					<Pattern pattern={pattern} />
					<DropdownButton bsSize="xsmall" pullRight >
						<MenuItem eventKey="1" onSelect={this.editPattern}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
						<MenuItem eventKey="2" onSelect={this.lockPattern}><i className="fa fa-lock"></i> Lock pattern</MenuItem>
						<MenuItem eventKey="3" onSelect={this.copyPattern}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
						<MenuItem eventKey="3" onSelect={this.deletePattern}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
					</DropdownButton>
				</div>
			);
		};
		return (
			<div style={{WebkitUserSelect: "none"}}>
				<button type="button" style={{width: "100%"}}><i className="fa fa-plus"></i> add pattern</button>
				<div>
					{this.props.patterns.map( createPattern, this )}  // "this" is the magic
				</div>
			</div>

		);
	}


});

module.exports = PatternList;

		/*
		var createPattern = function(pattern) {
			return (
				<ListGroupItem key={pattern.id} >
				<button onClick={playPattern} style={{borderStyle: "none", background: "white"}}><i className="fa fa-play"></i></button>
				<span style={{display: "inline-block", width: 100, textAlign: "right", textOverflow: "ellipsis", whiteSpace: "no-wrap"}}>
					{pattern.name}</span>: {pattern.colors.map( createSwatch )}
				</ListGroupItem>
			);
		};		
		return (
			<div>
			<button type="button">add pattern</button>
			<ListGroup>
			{this.props.patterns.map( createPattern )}
			</ListGroup>
			</div>
		);*/
