"use strict";

var React = require('react');

var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;
var MenuItem = require('react-bootstrap').MenuItem;
var DropdownButton = require('react-bootstrap').DropdownButton;

var Pattern = require('./pattern');

var remote = window.require('remote');
var PatternsApi = remote.require('./src/server/patternsApi');


var PatternList = React.createClass({
	//mixins: [
	//	require('react-onclickoutside')
	//],
	propTypes: {
		//onPatternChange: React.PropTypes.func
	},

	getInitialState: function() {
		var patterns = PatternsApi.getAllPatterns();
		//patterns[0].system = false;
		//patterns[0].locked = false; // testing
		console.log("patternList: getInitialState!");
		return {
			editing: false,
			editId: '',
			patterns: patterns
		};
	},
	componentDidMount: function() {
		PatternsApi.addChangeListener( this.updatePatternState );
	},
	updatePatternState: function() {
		console.log("done it");
		this.setState( {patterns: PatternsApi.getAllPatterns()} );
	},

	handleClickOutside: function(evt) { // part of react-onclickoutside
		console.log("handleClickOutside: ", evt);
		if( this.state.editing ) {
			this.setState( { editing: false, editId: ''} );
		}
	},
	addPattern: function() {
		console.log("addPattern: ");
		PatternsApi.newPattern('new pattern', '#ff00ff');
		this.setState( {patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
		console.log(JSON.stringify(this.state.patterns)); // dump all patterns
	},
	playStopPattern: function(pattid) { // FIXME: should have 'play' and 'stop'
		var p = PatternsApi.getPatternById( pattid );
		p.playing = !p.playing;
		//PatternsApi.savePattern( p );
		console.log("playStopPattern: ", pattid, p.playing);
		if( p.playing ) {
			PatternsApi.playPattern(pattid, this.updatePatternState);
			/*function() {
				console.log("done playing");
				//this.setState( {patterns: PatternsApi.getAllPatterns()} );
				this.doneIt();
			});*/
		}
		else {
			PatternsApi.stopPattern(pattid);
		}
		this.setState( {patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
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
		p.id = 0; // unset to regen for Api // FIXME:!!!
		p.name = p.name + " (copy)";
		p.system = false;
		p.locked = false;
		PatternsApi.savePattern( p );
		this.setState( {editing: true, editId: p.id, patterns: PatternsApi.getAllPatterns()} );  // tell React to reload this component?
	},
	deletePattern: function(pattid) {
		console.log("deletePattern:", pattid);
		PatternsApi.deletePattern( pattid );
		this.setState( {editing: false, patterns: PatternsApi.getAllPatterns()});
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
		console.log("patternList.render");

		var createPatternRow = function(patt) {
			var pid = patt.id;
			var noEdit = patt.system || patt.locked;
			var editingThis = (this.state.editing && (this.state.editId === pid));
			//console.log("editingThis: ", editingThis);
			var patternStyle = {
				borderStyle: "solid", borderWidth: 1, borderRadius: "4%", borderColor: "#eee", padding: 2, margin: 0,
				background: "#fff"
			};
			var playButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2 };
			var editButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, borderLeftStyle: "solid", float: "right" };
			var lockButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, width: 15 };
			var patternStateIcon = (patt.playing) ? 'fa-stop' : 'fa-play';
			var lockMenuIcon = (patt.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
			var lockMenuText = (patt.locked) ? "Unlock pattern" : "Lock pattern";
			//var lockIcon =

			var editOptions =
				<DropdownButton style={editButtStyle} pullRight >
					<MenuItem eventKey="1" onSelect={this.editPattern.bind(null, pid)} disabled={patt.system || patt.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
					<MenuItem eventKey="2" onSelect={this.lockPattern.bind(null, pid)} disabled={patt.system}><i className={lockMenuIcon}></i> {lockMenuText}</MenuItem>
					<MenuItem eventKey="3" onSelect={this.copyPattern.bind(null, pid)}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
					<MenuItem eventKey="4" onSelect={this.deletePattern.bind(null, pid)} disabled={patt.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
				</DropdownButton>;
			if( editingThis ) {
				editOptions =
					<span>
						<Button onClick={this.deletePattern.bind(null, pid)} style={playButtStyle}><i className="fa fa-remove"></i></Button>
						<Button onClick={this.handleClickOutside} style={playButtStyle}><i className="fa fa-check"></i></Button>
					</span>;
				patternStyle.borderColor = "#f99";
			}

			return (
				<tr key={patt.id} ><td style={{margin: 0, padding: 0}}>
					<Button onClick={this.playStopPattern.bind(null, pid)} style={playButtStyle}><i className={(patt.playing) ? "fa fa-stop" : "fa fa-play"}></i></Button>
					<Pattern pattern={patt} editing={editingThis} onRepeatsClick={this.onRepeatsClick} />
					{(!editingThis) ? <Button style={lockButtStyle}><i className={patt.locked ? "fa fa-lock" : ""}></i></Button> : null }
					{editOptions}
				</td></tr>
			);
				//(patt.locked<Button style={lockButtStyle}><i className={(patt.locked) ? "fa fa-lock" : ""}></i></Button>					<Button style={lockButtStyle}><i className={(patt.locked) ? "fa fa-lock" : ""}></i></Button>
		};

		return (
			<Table hover >
				<tbody>
				<tr><td><button onClick={this.addPattern} className="btn-block" ><i className="fa fa-plus"></i> add pattern</button></td></tr>
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
