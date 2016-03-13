"use strict";

var React = require('react');

var _ = require('lodash');

var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');

var Button = require('react-bootstrap').Button;
var MenuItem = require('react-bootstrap').MenuItem;
var DropdownButton = require('react-bootstrap').DropdownButton;

var log = require('../../logger');

var PatternView = React.createClass({
	propTypes: {
		pattern: React.PropTypes.object.isRequired,
		onPatternUpdated: React.PropTypes.func,
		onCopyPattern: React.PropTypes.func,
		onDeletePattern: React.PropTypes.func,
	},
	getInitialState: function() {
		return {
			activeSwatch: -1,
            pattern: _.clone(this.props.pattern),
			editing: false
		};
	},
	onNameChange: function(event) {
        var field = event.target.name;
        var value = event.target.value;
        log.msg('PatternView.onNameChange field,value', field, value);
		var pattern = this.state.pattern;
		pattern.name = value;
		this.setState( {pattern: pattern});
		// this.props.onPatternUpdated(pattern);
    },
	onSwatchClick: function(coloridx) {
		log.msg("PatternView.onSwatchClick", this.props.pattern.id, coloridx);
		var pattern = this.state.pattern;
		var acolor = pattern.colors[coloridx];

		// FIXME: this doesn't work
		if( this.state.editing ) {
			log.msg("PatternView.onSwatchClick: editing!");
			this.setState({activeSwatch: coloridx});
			Blink1Service.fadeToColor( acolor.time*1000, acolor.rgb, acolor.ledn );
			// which cause "onColorChanged()" to get called
		}
		else {
			// log.msg("color: ", pattern.colors[coloridx]);
			Blink1Service.fadeToColor( acolor.time*1000, acolor.rgb, acolor.ledn );
		}
        //this.props.onSwatchClick(this.props.pattern.id, coloridx);
	},
	onAddSwatch: function() {
        // var colors = this.state.pattern.colors;
		var pattern = this.state.pattern;
		log.msg('PatternView.addSwatch prev colors',pattern.colors);
        //this.props.onAddSwatch(this.props.pattern.id);
		var newcolor = {
			rgb: Blink1Service.getCurrentColor().toHexString(),
			time: Blink1Service.getCurrentMillis() / 1000, // FIXME
			ledn: Blink1Service.getCurrentLedN()
		};
		// var colors = pattern.colors
        pattern.colors.push( newcolor );
        log.msg('addSwatch, colors:', pattern.colors);
        this.setState( {pattern: pattern});
		this.props.onPatternUpdated(pattern);
	},
	onRepeatsClick: function() {
		log.msg("PatternView.onRepeatsClick");
		var pattern = this.state.pattern; //repeats = this.state.pattern.repeats;
		pattern.repeats++;
		if( pattern.repeats > 9 ) { pattern.repeats = 0; }
		this.setState({pattern: pattern});
		this.props.onPatternUpdated(pattern);
	},
	onPlayStopPattern: function() { // FIXME: should have 'play' and 'stop'
		var pattern = this.state.pattern;
		pattern.playing = !pattern.playing;
		this.setState({pattern: pattern, editing: false});
		log.msg("PatternView.onPlayStopPattern", pattern.id, pattern.playing);
		if( pattern.playing ) {
			log.msg("PLAYING");
			PatternsService.playPattern(pattern.id);
		}
		else {
			PatternsService.stopPattern(pattern.id);
		}
	},
	onColorChanged: function() {
		log.msg("PatternView.onColorChanged");
		if( this.state.editing ) {
			log.msg("PatternView.onColorChanged, editing: activeSwatch",this.state.activeSwatch, "color:", Blink1Service.getCurrentColor().toHexString());
			// var color = pattern.colors[this.state.activeSwatch];
			var newcolor = {
				rgb: Blink1Service.getCurrentColor().toHexString(),
				time: Blink1Service.getCurrentMillis() / 1000, // FIXME
				ledn: Blink1Service.getCurrentLedN()
			};
			var pattern = this.state.pattern;
			pattern.colors[this.state.activeSwatch] = newcolor;
			this.setState({pattern: pattern});
		}
	},
	onEditPattern: function() {
		log.msg("PatternView.onEditPattern");
		var pattern = this.state.pattern;
		if( pattern.playing ) { PatternsService.stopPattern(pattern.id); }

		Blink1Service.addChangeListener( this.onColorChanged, "patternView" );

		this.setState( {editing: true });
	},
	onLockPattern: function() {
		log.msg("PatternView.onLockPattern");
		var pattern = this.state.pattern;
		pattern.locked = !pattern.locked;
		this.setState({pattern:pattern});
	},
	onCopyPattern: function() {
		log.msg("onCopyPattern", this.state.pattern.id);
		var pattern = this.state.pattern;
		this.props.onCopyPattern( pattern.id );
	},
	onDeletePattern: function() {
		log.msg("onDeletePattern", this.state.pattern.id);
		var pattern = this.state.pattern;
		this.props.onDeletePattern( pattern.id );
	},
	onEditDone: function() {
		log.msg("PatternView.onEditDone");
		this.setState( {editing: false, activeSwatch:-1 });
		var pattern = this.state.pattern;
		Blink1Service.removeChangeListener( "patternView" ); // FIXME HACK
		this.props.onPatternUpdated(pattern);
	},

	render: function() {
		var pattern = this.state.pattern;
		var pid = pattern.id;
		//log.msg("PatternView.render: pid:",pid,"playing:",pattern.playing);
		var editingThis = (this.state.editing);// && (patterneditId === pid));

		var pattStyle = { width: 250, display: "inline-block",  border:'0px solid blue'};
		var pattNameStyle = {width: 100, display: "inline-block", border: '0px solid blue',
				textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%",
			borderRight: "1px solid #bbb", marginRight:2, paddingRight:2};
        var swatchSetStyle = { width: 115, overflow: "scroll" };
		var swatchStyle = { width: 15, height: 15, border:0, padding:0,
			borderWidth: 1, borderColor: "#bbb", borderRadius: 3, borderStyle: "solid", marginLeft: 1, display: "inline-flex",
			background: "inherit" };
		var addSwatchStyle = _.clone(swatchStyle);
    	_.assign( addSwatchStyle, { padding: 0, marginTop:0, marginLeft:3, border:0 } );
		var repeatsStyle = { width: 30, margin:0, padding:0, fontSize: "80%", border:'0px solid green', background: "inherit" };

		var repstr = (pattern.repeats) ? 'x' + pattern.repeats : '';
		var repeats = <i className="fa fa-repeat">{repstr}</i>;

		var nameField = (this.state.editing) ?
			<input style={pattNameStyle} type="text" name="name" value={pattern.name}
				onChange={this.onNameChange} />
			: <span style={{width: 120, cursor:'default'}}><span style={pattNameStyle}>{pattern.name}</span></span>;

		// also see: https://facebook.github.io/react/tips/expose-component-functions.html
		var createSwatch = function(color, i) {
			var ss = _.clone(swatchStyle); // dont need this now
			ss.background = color.rgb;
			if( this.state.editing && i === this.state.activeSwatch ) {
				 ss.borderColor='#333'; ss.borderWidth = 3;
			} else {
				ss.borderColor='#bbb';
			}
			return (
				<div onClick={this.onSwatchClick.bind(this, i)} key={i} style={ss}></div>
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

		var addSwatchButton = (!this.state.editing) ? '' :
            <button onClick={this.onAddSwatch} type="button" key={99} style={addSwatchStyle}><i className="fa fa-plus" style={{}}></i></button>;

		var playButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, outline: 0 };
		var lockButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, width: 15 };

		var lockButton = (editingThis) ? '':<Button style={lockButtStyle}><i className={pattern.locked ? "fa fa-lock" : ""}></i></Button>;

//					<Button onClick={this.onDeletePattern} style={playButtStyle}><i className="fa fa-remove"></i></Button>
		var editOptions =
			<DropdownButton style={editButtStyle} title="" id={pid} pullRight >
				<MenuItem eventKey="1" onSelect={this.onEditPattern} disabled={pattern.system || pattern.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
				<MenuItem eventKey="2" onSelect={this.onLockPattern} disabled={pattern.system}><i className={lockMenuIcon}></i> {lockMenuText}</MenuItem>
				<MenuItem eventKey="3" onSelect={this.onCopyPattern}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
				<MenuItem eventKey="4" onSelect={this.onDeletePattern} disabled={pattern.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
			</DropdownButton>;
		if( editingThis ) {
			editOptions =
				<span style={{float:'right'}}>
					<Button onClick={this.onEditDone} style={playButtStyle}><i className="fa fa-check"></i></Button>
				</span>;
			patternStyle.borderColor = "#f99";
		}

		return (
			<span style={{display:'inline-block', border:'0px solid red'}}>

				<Button onClick={this.onPlayStopPattern} style={playButtStyle}><i className={(pattern.playing) ? "fa fa-stop" : "fa fa-play"}></i></Button>

	        	<span style={pattStyle}>
					{nameField}
	                <span style={swatchSetStyle}>
	                    <span style={{ width: 200 }}>
	                        {pattern.colors.map( createSwatch, this)}
	                        {addSwatchButton}
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
