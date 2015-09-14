"use strict";

var React = require('react');
var Button = require('react-bootstrap').Button;
var Dropdown = require('react-bootstrap').Dropdown;
var MenuItem = require('react-bootstrap').MenuItem;
var DropdownButton = require('react-bootstrap').DropdownButton;

var Pattern = require('./pattern');

var PatternsApi = require('../../api/patternsApi');


var PatternList = React.createClass({
	propTypes: {
		onPatternChange: React.PropTypes.func
	},

	getInitialState: function() {
		return { 
			editing: false,
			patterns: PatternsApi.getAllPatterns()
		};
	},

	handleRepeatsClick: function(pattern) {
		console.log("real handleRepeatsClick: ", pattern);
		//this.props.onPatternChange( pattern );
	},

	playPattern: function(e) {
		console.log("playPattern: ", e);
		//this.props.onPatternChange(pattern);
	},
	editPattern: function(p) {
		console.log("editPattern:", p);
		this.setState( {editing: true} );
	},
	lockPattern: function(p) {
		console.log("lockPattern:", p);
		p.locked = !p.locked;
		PatternsApi.savePattern( p );
		this.setState( {patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
	},
	copyPattern: function(p) {
		console.log("copyPattern:", p);
		p.id = 0; // unset to regen  // FIXME:!!!
		p.name = p.name + " (copy)";
		p.system = false;
		p.locked = false;
		PatternsApi.savePattern( p );
		this.setState( {patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
	},
	deletePattern: function(p) {
		console.log("deletePattern:", p);
		PatternsApi.deletePattern( p.id );
		this.setState( {editing: false} );
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
			var lockIcon = (pattern.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
			var lockText = (pattern.locked) ? "Unlock pattern" : "Lock pattern";
			var editButton = 
				<DropdownButton bsSize="xsmall" pullRight >
					<MenuItem eventKey="1" onSelect={this.editPattern.bind(null, pattern)} disabled={pattern.system || pattern.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
					<MenuItem eventKey="2" onSelect={this.lockPattern.bind(null, pattern)} diabled={pattern.system || pattern.locked}><i className={lockIcon}></i> {lockText}</MenuItem>
					<MenuItem eventKey="3" onSelect={this.copyPattern.bind(null, pattern)}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
					<MenuItem eventKey="4" onSelect={this.deletePattern.bind(null, pattern)} disabled={pattern.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
				</DropdownButton>;
			if( this.state.editing ) {
				editButton = <Button onClick={this.deletePattern.bind(null, pattern)} style={playButtStyle}><i className="fa fa-remove"></i></Button>;
			}

			return (
				<div key={pattern.id} style={patternStyle} disabled={true}>
					<Button onClick={this.playPattern} bsSize="xsmall"><i className="fa fa-play"></i></Button>
					<Pattern pattern={pattern} />
					{editButton}
				</div>
			);
		};

		return (
			<div style={{WebkitUserSelect: "none"}}>
				<button type="button" style={{width: "100%"}}><i className="fa fa-plus"></i> add pattern</button>
				<div>
					{this.state.patterns.map( createPattern, this )}
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
