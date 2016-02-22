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
			// editing: false,
			// editId: '',
			patterns: this.getAllPatterns()
		};
	},
	getAllPatterns: function() { // get attr-only copy of remote'd object
		return _.clone(PatternsService.getAllPatterns());
	},
	componentDidMount: function() {
		PatternsService.addChangeListener( this.updatePatternState, "patternList" );
	}, // FIXME: Surely there's a better way to do this
	componentWillUnmount: function() {
		PatternsService.removeChangeListener( "patternList" );
	},
	/** Callback to PatternsService.addChangeListener */
	updatePatternState: function() {
		// console.log("PatternList.updatePatternState old",this.state.patterns);
		this.setState( {patterns: this.getAllPatterns() } );
	},

	onAddPattern: function() {
		console.log("onAddPattern");
		var p = PatternsService.newPattern();
		p.id = 0; // force regen
		PatternsService.savePattern( p );
		// this.setState( {editing: true, editId: p.id } );
		// this.updatePatternState();
		// console.log(JSON.stringify(this.state.patterns)); // dump all patterns
	},
	copyPattern: function(patternid) {
		console.log("copyPattern:", patternid);
		var p = PatternsService.getPatternById( patternid );
		p.id = 0; // unset to regen for Api // FIXME:!!!
		p.name = p.name + " (copy)";
		p.system = false;
		p.locked = false;
		PatternsService.savePattern( p );
		// this.setState( {editing: true, : p.id } );
		// this.updatePatternState();
	},
	deletePattern: function(patternid) {
		console.log("deletePattern:", patternid);
		// this.setState( {editing: false} );
		PatternsService.deletePattern( patternid );
		// this.updatePatternState();
	},

	onPatternUpdated: function(pattern) {
		console.log("PatternList.onPatternUpdated:", pattern);
		PatternsService.savePattern(pattern);
	},

	render: function() {
		console.log("patternList.render",this.state.patterns);

		var createPatternRow = function(patt, idx) {
			return (
				<tr key={patt.id + idx} >
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
				<tr><td><Button onClick={this.onAddPattern} bsSize="xsmall" block><i className="fa fa-plus"></i>add pattern</Button></td></tr>
				{this.state.patterns.map( createPatternRow, this )}
				</tbody>
			</Table>

		);
	}


});

module.exports = PatternList;
