"use strict";

var React = require('react');

var _ = require('lodash');
var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');
var PatternsService = remote.require('./server/patternsService');

var Button = require('react-bootstrap').Button;
var MenuItem = require('react-bootstrap').MenuItem;
var DropdownButton = require('react-bootstrap').DropdownButton;

var PatternView = React.createClass({
	propTypes: {
		pattern: React.PropTypes.object.isRequired,
		// editing: React.PropTypes.bool,
		onPatternUpdated: React.PropTypes.func,
		onCopyPattern: React.PropTypes.func,
		onDeletePattern: React.PropTypes.func,
	},
	getInitialState: function() {
		return {
			activeSwatch: -1,
            pattern: _.clone(this.props.pattern),
		};
	},
	onNameChange: function(event) {
        var field = event.target.name;
        var value = event.target.value;
        console.log('field,value', field, value);
		var pattern = this.state.pattern;
		pattern.naem = value;
		this.setState( {pattern: pattern});
		this.props.onPatternUpdated(pattern);
    },
	onSwatchClick: function(coloridx) {
		console.log("PatternView.onSwatchClick", this.props.pattern.id, coloridx);
		this.setState({activeSwatch: coloridx});
		var pattern = this.state.pattern;

		// FIXME: this doesn't work
		if( this.state.editing ) {
			console.log("PatternView.onSwatchClick: editing!");
			var newcolor = {
				rgb: Blink1Service.getCurrentColor(),
				time: 0.23, // FIXME:
				ledn: Blink1Service.getCurrentLedN()
			};
			// var colors = this.state.pattern.colors[idx] = newcolor;
			// colors[idx] = newcolor;
			pattern.colors[coloridx] = newcolor;
			this.setState( {pattern: pattern});
			this.props.onPatternUpdated(pattern);
		}
		else {
			console.log("color: ", pattern.colors[coloridx]);
			Blink1Service.fadeToColor( 100, pattern.colors[coloridx], 0 );
		}
        //this.props.onSwatchClick(this.props.pattern.id, coloridx);
	},
	onAddSwatch: function() {
        // var colors = this.state.pattern.colors;
		var pattern = this.state.pattern;
		console.log('PatternView.addSwatch prev colors',pattern.colors);
        //this.props.onAddSwatch(this.props.pattern.id);
		var newcolor = {
			rgb: Blink1Service.getCurrentColor(),
			time: 0.23, // FIXME
			ledn: Blink1Service.getCurrentLedN()
		};
		// var colors = pattern.colors
        pattern.colors.push( newcolor );
        console.log('addSwatch, colors:', pattern.colors);
        this.setState( {pattern: pattern});
		this.props.onPatternUpdated(pattern);
	},
	onRepeatsClick: function() {
		console.log("PatternView.onRepeatsClick");
		var pattern = this.state.pattern; //repeats = this.state.pattern.repeats;
		pattern.repeats++;
		if( pattern.repeats > 9 ) { pattern.repeats = 0; }
		this.setState({pattern: pattern});
		this.props.onPatternUpdated(pattern);
	},
    // onDoneEditing: function() {
	// 	console.log("PatternView.onDoneEditing");
	// 	// FIXME: how to do this  UNUSED?
    // },
	playStopPattern: function() { // FIXME: should have 'play' and 'stop'
		console.log("PatternView.playStopPattern");
		var pattern = this.state.pattern;
		pattern.playing = !pattern.playing;
		this.setState({pattern: pattern});
		console.log("PatternView.playStopPattern", pattern.id, pattern.playing);
		var self = this;
		if( pattern.playing ) {
			PatternsService.playPattern(pattern.id, function() {
				console.log("done playing");
				var pattern = self.state.pattern;
				pattern.playing = false;
				self.setState({pattern: pattern });
			});
		}
		else {
			PatternsService.stopPattern(pattern.id);
		}
	},
	onEditPattern: function() {
		console.log("PatternView.onEditPattern");
		this.setState( {editing: true });
	},
	onEditDone: function() {
		console.log("PatternView.onEditDone");
		this.setState( {editing: false });
	},
		// if( this.state.editing ) {
		// 	console.log("PatternList.handleClickOutside: done editing");
		// 	// PatternsService.savePattern();
		// 	this.setState( { editing: false, editId: ''} );
		// 	this.updatePatternState();
		// }
	// },

	onLockPattern: function() {
		console.log("PatternView.onLockPattern");
		// var pattern = this.state.pattern;
		// pattern.locked = !pattern.locked;
		//
		// this.updatePatternState();
	},
	onCopyPattern: function() {
		console.log("copyPattern");
		// var p = PatternsService.getPatternById( pattid );
		// p.id = 0; // unset to regen for Api // FIXME:!!!
		// p.name = p.name + " (copy)";
		// p.system = false;
		// p.locked = false;
		// PatternsService.savePattern( p );
		// this.setState( {editing: true, editId: p.id } );
		// this.updatePatternState();
	},
	onDeletePattern: function() {
		console.log("onDeletePattern");
		// PatternsService.deletePattern( pattid );
		// this.setState( {editing: false} );
		// this.updatePatternState();
	},

	render: function() {
		var pattern = this.state.pattern;
		var pid = pattern.id;
		var editingThis = (this.state.editing);// && (patterneditId === pid));

		var pattStyle = { width: 250, display: "inline-block",   border:'1px solid blue'};
		var pattNameStyle = {width: 75, display: "inline-block", padding: 4, margin: 0, verticalAlign: "middle",
				textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%" };
        var swatchSetStyle = { width: 115, overflow: "scroll" };
		var swatchStyle = { width: 15, height: 15, margin: 0,
			borderWidth: 1, borderColor: "#999", borderStyle: "solid", marginLeft: 1, display: "inline-block",
			background: "inherit" };
		var addSwatchStyle = _.clone(swatchStyle);
    	_.assign( addSwatchStyle, { padding: 0, marginTop:0 } );
		var repeatsStyle = { width: 30, padding: 5, fontSize: "80%", borderStyle: "none", background: "inherit" };

		var repstr = (pattern.repeats) ? 'x' + pattern.repeats : '';
		var repeats = <i className="fa fa-repeat">{repstr}</i>;

		var nameField = (this.state.editing) ?
			<input style={pattNameStyle} type="text" name="name" value={pattern.name}
				onChange={this.onNameChange} />
			: <span style={{width: 75}}><span style={pattNameStyle}>{pattern.name}</span></span>;

		// also see: https://facebook.github.io/react/tips/expose-component-functions.html
		var createSwatch = function(color, i) {
			var ss = _.clone(swatchStyle); // dont need this now
			ss.background = color.rgb;
			return (
				<button onClick={this.onSwatchClick.bind(this, i)} type="button" key={i} style={ss}></button>
			);
		};

		var patternStyle = {
			borderStyle: "solid", borderWidth: 1, borderRadius: "4%", borderColor: "#eee", padding: 2, margin: 0,
			background: "#fff"
		};
		var editButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, borderLeftStyle: "solid", float: "right" };
		//var patternStateIcon = (patt.playing) ? 'fa-stop' : 'fa-play';
		var lockMenuIcon = (pattern.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
		var lockMenuText = (pattern.locked) ? "Unlock pattern" : "Lock pattern";

		var plusSwatchButton = (!this.state.editing) ? '' :
            <button onClick={this.onAddSwatch} type="button" key={99} style={addSwatchStyle}><i className="fa fa-plus" style={{margin:0, padding:0}}></i></button>;

		var playButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, outline: 0 };
		var lockButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, width: 15 };

		var lockButton = (editingThis) ? '':<Button style={lockButtStyle}><i className={pattern.locked ? "fa fa-lock" : ""}></i></Button>;

		var editOptions =
			<DropdownButton style={editButtStyle} title="" id={pid} pullRight >
				<MenuItem eventKey="1" onSelect={this.onEditPattern} disabled={pattern.system || pattern.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
				<MenuItem eventKey="2" onSelect={this.onLockPattern} disabled={pattern.system}><i className={lockMenuIcon}></i> {lockMenuText}</MenuItem>
				<MenuItem eventKey="3" onSelect={this.onCopyPattern}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
				<MenuItem eventKey="4" onSelect={this.onDeletePattern} disabled={pattern.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
			</DropdownButton>;
		if( editingThis ) {
			editOptions =
				<span>
					<Button onClick={this.onDeletePattern} style={playButtStyle}><i className="fa fa-remove"></i></Button>
					<Button onClick={this.onEditDone} style={playButtStyle}><i className="fa fa-check"></i></Button>
				</span>;
			patternStyle.borderColor = "#f99";
		}

		return (
			<span style={{display:'inline-block', border:'1px solid red'}}>

				<Button onClick={this.playStopPattern} style={playButtStyle}><i className={(pattern.playing) ? "fa fa-stop" : "fa fa-play"}></i></Button>

	        	<span style={pattStyle}>
					{nameField}
	                <span style={swatchSetStyle}>
	                    <span style={{ width: 200 }}>
	                        {pattern.colors.map( createSwatch, this)}
	                        {plusSwatchButton}
	                        <button onClick={this.onRepeatsClick}
	                                style={repeatsStyle} disabled={!this.state.editing} >{repeats}</button>
	                    </span>
	                </span>
	            </span>

				{lockButton}
				{editOptions}
			</span>
		);
	}
});

module.exports = PatternView;
