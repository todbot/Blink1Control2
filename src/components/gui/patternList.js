"use strict";

var React = require('react');
var Button = require('react-bootstrap').Button;
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Dropdown = require('react-bootstrap').Dropdown;
var MenuItem = require('react-bootstrap').MenuItem;
var DropdownButton = require('react-bootstrap').DropdownButton;

var Pattern = require('./pattern');

var PatternsApi = require('../../api/patternsApi');


var PatternList = React.createClass({
	mixins: [
		require('react-onclickoutside')
	],
	propTypes: {
		onPatternChange: React.PropTypes.func
	},

	getInitialState: function() {
		var patterns = PatternsApi.getAllPatterns();
		//patterns[0].system = false;
		//patterns[0].locked = false; // testing
		return { 
			editing: false,
			editId: null,
			patterns: patterns
		};
	},

	handleClickOutside: function(evt) { // part of react-onclickoutside
		console.log("handleClickOutside: ", evt);
		this.setState( { editing: false, editId: 0} ); 
	},
	addPattern: function() {
		console.log("addPattern: ");
		console.log(JSON.stringify(this.state.patterns));
	},
	playPattern: function(pattid) {
		console.log("playPattern: ", pattid);
		//this.props.onPatternChange(pattern);
	},
	editPattern: function(pattid) {
		console.log("editPattern:", pattid);
		this.setState( {editing: true, editId: pattid} );
	},
	lockPattern: function(pattid) {
		console.log("lockPattern:", pattid);
		var p = PatternsApi.getPatternById( pattid );
		p.locked = !p.locked;
		PatternsApi.savePattern( p );
		this.setState( {patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
	},
	copyPattern: function(pattid) {
		console.log("copyPattern:", pattid);
		var p = PatternsApi.getPatternById( pattid );
		p.id = 0; // unset to regen  // FIXME:!!!
		p.name = p.name + " (copy)";
		p.system = false;
		p.locked = false;
		PatternsApi.savePattern( p );
		this.setState( {editing: true, editId: p.id, patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
	},
	deletePattern: function(pattid) {
		console.log("deletePattern:", pattid);
		PatternsApi.deletePattern( pattid );
		this.setState( {editing: false} );
	},
	onRepeatsClick: function(pattid) {
		console.log("onRepeatsClick:", pattid);
		if( this.state.editing ) {
			var p = PatternsApi.getPatternById( pattid );
			p.repeats++;
			if( p.repeats > 9 ) { p.repeats = 0; }
			PatternsApi.savePattern( p );
			this.setState( {patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?		
		}
	},

	render: function() {

		var createPatternView = function(patt) {
			var pid = patt.id;
			var noEdit = patt.system || patt.locked;
			var patternStyle = {
				borderStyle: "solid", borderWidth: 1, borderRadius: "4%", borderColor: "#eee", padding: 2, margin: 0,
				background: "#fff"
			};
			var playButtStyle = {borderStyle: "none", background: "white", display: "inline", padding: 2 };
			var editButtStyle = {borderStyle: "none", background: "white", borderLeftStyle: "solid", float: "right", padding: 4 };
			var lockButtStyle = {borderStyle: "none", background: "white", display: "inline", padding: 2, width: 15 };
			var patternStateIcon = (patt.playing) ? 'fa-stop' : 'fa-play';
			var lockMenuIcon = (patt.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
			var lockMenuText = (patt.locked) ? "Unlock pattern" : "Lock pattern";
			var editOptions = 
				<DropdownButton bsSize="xsmall" pullRight >
					<MenuItem eventKey="1" onSelect={this.editPattern.bind(null, pid)} disabled={patt.system || patt.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
					<MenuItem eventKey="2" onSelect={this.lockPattern.bind(null, pid)} disabled={patt.system}><i className={lockMenuIcon}></i> {lockMenuText}</MenuItem>
					<MenuItem eventKey="3" onSelect={this.copyPattern.bind(null, pid)}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
					<MenuItem eventKey="4" onSelect={this.deletePattern.bind(null, pid)} disabled={patt.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
				</DropdownButton>;
			if( this.state.editing && this.state.editId === pid ) {
				editOptions = 
					<ButtonGroup>
						<Button onClick={this.deletePattern.bind(null, patt)} style={playButtStyle}><i className="fa fa-remove"></i></Button>
						<Button onClick={this.handleClickOutside} style={playButtStyle}><i className="fa fa-check"></i></Button>
					</ButtonGroup>;
				patternStyle.borderColor = "#f99";
			}

			return (
				<div key={patt.id} style={patternStyle} >
					<Button onClick={this.playPattern} bsSize="xsmall"><i className="fa fa-play"></i></Button>
					<Pattern pattern={patt} editing={this.state.editing} onRepeatsClick={this.onRepeatsClick} />
					<Button style={lockButtStyle}><i className={(patt.locked) ? "fa fa-lock" : ""}></i></Button>
					{editOptions}
				</div>
			);
		};

		return (
			<div style={{WebkitUserSelect: "none"}}>
				<button onClick={this.addPattern} style={{width: "100%"}}><i className="fa fa-plus"></i> add pattern</button>
				<div>
					{this.state.patterns.map( createPatternView, this )}
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
