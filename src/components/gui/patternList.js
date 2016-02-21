"use strict";

var React = require('react');
var _ = require('lodash');

var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;

var PatternView = require('./patternView');

var remote = window.require('remote');
var PatternsService = remote.require('./server/patternsService');
// var Blink1Service = remote.require('./server/blink1Service');

var PatternList = React.createClass({
	//mixins: [
	//	require('react-onclickoutside')
	//],

	getInitialState: function() {
		console.log("patternList: getInitialState!");
		return {
			editing: false,
			editId: '',
			patterns: this.getAllPatterns()
		};
	},
	getAllPatterns: function() { // get attr-only copy of remote'd object
		return _.clone(PatternsService.getAllPatterns(), true);
	},
	componentDidMount: function() {
		PatternsService.addChangeListener( this.updatePatternState, "patternList" );
	}, // FIXME: Surely there's a better way to do this
	componentWillUnmount: function() {
		PatternsService.removeChangeListener( "patternList" );
	},
	updatePatternState: function() {
		console.log("PatternList.updatePatternState");
		this.setState( {patterns: this.getAllPatterns() } );
	},

	handleClickOutside: function(evt) { // part of react-onclickoutside
		console.log("handleClickOutside: ", evt.target.value, evt);
		if( this.state.editing ) {
			console.log("PatternList.handleClickOutside: done editing");
			// PatternsService.savePattern();
			this.setState( { editing: false, editId: ''} );
			this.updatePatternState();
		}
	},
	addPattern: function() {
		console.log("addPattern");
		var p = PatternsService.newPattern();
		PatternsService.savePattern( p );
		this.setState( {editing: true, editId: p.id } );
		this.updatePatternState();
		console.log(JSON.stringify(this.state.patterns)); // dump all patterns
	},
	lockPattern: function(pattid) {
		console.log("lockPattern:", pattid);
		var p = PatternsService.getPatternById( pattid );
		p.locked = !p.locked;
		PatternsService.savePattern( p );
		this.updatePatternState();
	},
	copyPattern: function(pattid) {
		console.log("copyPattern:", pattid);
		var p = PatternsService.getPatternById( pattid );
		p.id = 0; // unset to regen for Api // FIXME:!!!
		p.name = p.name + " (copy)";
		p.system = false;
		p.locked = false;
		PatternsService.savePattern( p );
		this.setState( {editing: true, editId: p.id } );
		this.updatePatternState();
	},
	deletePattern: function(pattid) {
		console.log("deletePattern:", pattid);
		PatternsService.deletePattern( pattid );
		this.setState( {editing: false} );
		this.updatePatternState();
	},

	onPatternUpdated: function(pattern) {
		console.log("PatternList.onPatternUpdated:", pattern);
		PatternsService.savePattern(pattern);
	},

	render: function() {
		// console.log("patternList.render");

		var createPatternRow = function(patt, idx) {
			// var pid = patt.id;
			//var noEdit = patt.system || patt.locked;
			// var editingThis = (this.state.editing && (this.state.editId === pid));
			//var lockIcon =
			// var playButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, outline: 0 };

			return (
				<tr key={idx} >
					<td style={{margin: 0, padding: 3}}>
						<PatternView
							pattern={patt}
							onPatternUpdated={this.onPatternUpdated}
							onCopyPattern={this.copyPattern}
							onDeletePattern={this.deletePattern} />
					</td>
				</tr>
			);
		};

		return (
			<Table hover >
				<tbody>
				<tr><td><Button onClick={this.addPattern} bsSize="xsmall" block><i className="fa fa-plus"></i> add pattern</Button></td></tr>
				{this.state.patterns.map( createPatternRow, this )}
				</tbody>
			</Table>

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
