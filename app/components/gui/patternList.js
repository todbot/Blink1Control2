"use strict";

var React = require('react');
//var update = require('react-addons-update');

// var _ = require('lodash');

var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var PatternView = require('./patternView');

var PatternsService = require('../../server/patternsService');
//var Blink1Service = require('../../server/blink1Service');

var log = require('../../logger');

var PatternList = React.createClass({
	//mixins: [
	//	require('react-onclickoutside')
	//],

	getInitialState: function() {
		log.msg("patternList: getInitialState!");
		return {
			patterns: PatternsService.getAllPatterns()
		};
	},
	componentDidMount: function() {
		PatternsService.addChangeListener( this.updatePatternState, "patternList" );
	}, // FIXME: Surely there's a better way to do this
	componentWillUnmount: function() {
		PatternsService.removeChangeListener( "patternList" );
	},
	/** Callback to PatternsService.addChangeListener */
	updatePatternState: function(allpatterns) {
		var patts = allpatterns;
		// log.msg("PatternList.updatePatternState");
		this.setState( {patterns: patts } );
	},

	onAddPattern: function() {
		log.msg("PatternList.onAddPattern");
		var p = PatternsService.newPattern();
		p.id = 0; // force id regen
		PatternsService.savePattern( p );
	},
	onStopAllPatterns: function() {
		log.msg("PatternList.onStopAllPatterns");
		PatternsService.stopAllPatterns();
	},
	copyPattern: function(patternid) {
		log.msg("PatternList.copyPattern:", patternid);
		var p = PatternsService.getPatternById( patternid );
		p.id = 0; // unset to regen for Api // FIXME:!!!
		p.name = p.name + " (copy)";
		p.system = false;
		p.locked = false;
		PatternsService.savePattern( p );
		// this.setState( {editing: true, : p.id } );
	},
	deletePattern: function(patternid) {
		log.msg("PatternList.deletePattern:", patternid);
		// this.setState( {editing: false} );
		PatternsService.deletePattern( patternid );
	},

	onPatternUpdated: function(pattern) {
		log.msg("PatternList.onPatternUpdated:", pattern);
		PatternsService.savePattern(pattern);
	},

	render: function() {
		// log.msg("patternList.render",this.state.patterns);

		var createPatternRow = function(patt, idx) {
			return (
				<tr key={patt.id + idx + patt.playing} style={{height:25}}>
					<td style={{ margin: 0, padding: 0}}>
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
			<div>
				<ButtonToolbar>
					<Button onClick={this.onStopAllPatterns} bsSize="xsmall" ><i className="fa fa-stop"></i> stop all</Button>
					<Button onClick={this.onAddPattern} bsSize="xsmall"  style={{float:'right'}}><i className="fa fa-plus"></i> new pattern</Button>
				</ButtonToolbar>
				<Table hover style={{display:'block', height:280, overflow:'scroll'}} >
					<tbody >
						{this.state.patterns.map( createPatternRow, this )}
					</tbody>
				</Table>
			</div>
		);
	}


});

module.exports = PatternList;
