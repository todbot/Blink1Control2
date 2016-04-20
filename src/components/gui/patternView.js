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
		if( !this.state.editing ) { return; }
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
	onSwatchDoubleClick(coloridx) {
		log.msg("PatternView.onSwatchDOUBLEClick", this.props.pattern.id, "swatch:",coloridx);
		var acolor = this.state.pattern.colors[coloridx];
		Blink1Service.fadeToColor( acolor.time*1000, acolor.rgb, acolor.ledn );
	},
	onSwatchClick: function(coloridx) {
		log.msg("PatternView.onSwatchClick", this.props.pattern.id, "swatch:",coloridx);
		var pattern = this.state.pattern;
		var acolor = pattern.colors[coloridx];

		// FIXME: this doesn't work
		if( this.state.editing ) {
			log.msg("PatternView.onSwatchClick: editing!");
			this.setState({activeSwatch: coloridx});
			// which cause "onColorChanged()" to get called
		}
		else {
			// log.msg("color: ", pattern.colors[coloridx]);
			Blink1Service.fadeToColor( acolor.time*1000, acolor.rgb, acolor.ledn );
		}
        //this.props.onSwatchClick(this.props.pattern.id, coloridx);
	},

	onColorChanged: function() {
		log.msg("PatternView.onColorChanged");
		if( this.state.editing ) {
			log.msg("PatternView.onColorChanged, editing: activeSwatch",this.state.activeSwatch,
			"color:", Blink1Service.getCurrentColor().toHexString());
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
		var isEditing = (this.state.editing);// && (patterneditId === pid));

		// var patternViewStyle = {display:'inline-block', border: (isEditing) ? '1px solid red': 'none'};
		var patternViewStyle = (isEditing) ? {display:'inline-block', background: '#ddd'} : {display:'inline-block'};
		var pattStyle = { width: 250, margin:0, padding:0, display: "inline-block",  border:'0px solid blue'};
		var pattNameStyle = {width: 90, display: "inline-block", border: '0px solid blue',
				textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%",
				borderRight: "1px solid #bbb", marginRight:2, paddingRight:2, marginTop:4 };
        var swatchSetStyle = { width: 115, overflow: "scroll" };
		var swatchStyle = { width: 17, height: 17, border:0, padding:0, marginLeft: 1, marginTop: 4, display: "inline-flex",
			borderWidth: 1, borderColor: "#bbb", borderRadius: 3, borderStyle: "solid",	background: "inherit" };
		var addSwatchStyle = _.clone(swatchStyle);
    	_.assign( addSwatchStyle, { padding: 0, marginTop:0, marginLeft:3, border:0 } );
		var repeatsStyle = { width: 30, margin:0, padding:0, marginTop:4, fontSize: "80%", border:'0px solid green', background: "inherit" };


		var nameField = (this.state.editing) ?
			<input style={pattNameStyle} type="text" name="name" value={pattern.name} onChange={this.onNameChange} />
			: <span style={pattNameStyle}>{pattern.name}</span>;
			// : <span style={{width: 120, cursor:'default'}}><span style={pattNameStyle}>{pattern.name}</span></span>;

		// also see: https://facebook.github.io/react/tips/expose-component-functions.html
		var createSwatch = function(color, i) {
			var ss = _.clone(swatchStyle); // dont need this now
			// ss.background = color.rgb;
			// prepare for multiple-colored backgrounds
			ss.background = 'linear-gradient(180deg, ' + color.rgb+', ' + color.rgb+' 50%, ' + color.rgb+' 50%, ' + color.rgb +')';

			if( isEditing && i === this.state.activeSwatch ) {
				 ss.borderColor='#333'; ss.borderWidth = 3;
			} else {
				ss.borderColor='#bbb';
			}
			return (
				<div onClick={this.onSwatchClick.bind(this, i)} onDoubleClick={this.onSwatchDoubleClick.bind(this,i)}
						key={i} style={ss}></div>
			);
		};

		// var patternStyle = {
		// 	borderStyle: "solid", borderWidth: 1, borderRadius: "4%", borderColor: "#eee", padding: 2, margin: 0,
		// 	background: "#fff"
		// };
		var editButtStyle = {borderStyle: "none", background: "inherit", display: "inline-block", padding: 2,
			borderLeftStyle: "solid", float: "right" };
		//var patternStateIcon = (patt.playing) ? 'fa-stop' : 'fa-play';
		var lockMenuIcon = (pattern.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
		var lockMenuText = (pattern.locked) ? "Unlock pattern" : "Lock pattern";

		var addSwatchButton = (!this.state.editing) ? null :
            <button onClick={this.onAddSwatch} type="button" key={99} style={addSwatchStyle}><i className="fa fa-plus" style={{}}></i></button>;

		var playButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 0, paddingBottom:2, outline: 0 };
		var lockButtStyle = {borderStyle: "none", background: "inherit", display: "inline", padding: 2, width: 15 };

		var lockButton = (isEditing) ? '':<Button style={lockButtStyle}><i className={pattern.locked ? "fa fa-lock" : ""}></i></Button>;

//		<Button onClick={this.onDeletePattern} style={playButtStyle}><i className="fa fa-remove"></i></Button>
		var editOptions =
			<DropdownButton style={editButtStyle} title="" id={pid} pullRight >
				<MenuItem eventKey="1" onSelect={this.onEditPattern} disabled={pattern.system || pattern.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
				<MenuItem eventKey="2" onSelect={this.onLockPattern} disabled={pattern.system}><i className={lockMenuIcon}></i> {lockMenuText}</MenuItem>
				<MenuItem eventKey="3" onSelect={this.onCopyPattern}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
				<MenuItem eventKey="4" onSelect={this.onDeletePattern} disabled={pattern.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
			</DropdownButton>;
		if( isEditing ) {
			editOptions = <Button onClick={this.onEditDone} style={playButtStyle}><i className="fa fa-check"></i></Button>;
		}

		/// --- begin the flex-ening
		var style_pattern = { width: 300, display:'flex', alignItems:'flex-start' };
		var style_playbutton = { width:20, height:20, marginTop:2 };
		var style_repeats = { flex:'0 0 auto', height:20, marginTop:2, fontSize:'80%' };
		var style_name = { width:100, textAlign:'right', borderRight:'1px grey', marginTop:2, marginRight:2, paddingRight:2,
			 				overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'90%' };
		var style_colorlist = { width:170, display:'flex', flexWrap:'wrap', alignItems:'center'};
		var style_colorswatch = { flex:'0 0 auto', width:17, height:17, margin:1, padding:1,
									borderWidth:1, borderStyle:'solid', borderRadius:3, borderColor:'#bbb' };
		var style_lockbutton={ width:20 };
		var style_editoptions= { width:20 };

		var nameIsh = (this.state.editing) ?
				<input type="text" name="name" value={pattern.name} onChange={this.onNameChange} /> : pattern.name;

		// var addSwatch = (!this.state.editing) ? null :
		// 	<button onClick={this.onAddSwatch} type="button" key={99} ><i className="fa fa-plus" style={{}}></i></button>;

		var createColorSwatch = function(color ,i) {
			var mystyle = _.clone(style_colorswatch);
			mystyle.backgroundColor = color;
			mystyle.background = 'linear-gradient(180deg, ' + color.rgb+', ' + color.rgb+' 50%, ' + color.rgb+' 50%, ' + color.rgb +')';
			if( this.state.editing && i === this.state.activeSwatch ) {
				 mystyle.borderColor='#333'; mystyle.borderWidth = 3;
			}
			return (
				<div style={mystyle} key={i}
					onClick={this.onSwatchClick.bind(this, i)}
					onDoubleClick={this.onSwatchDoubleClick.bind(this,i)}></div>
		 	);
		};

		return (
			<div style={style_pattern}>

				<div style={style_playbutton} onClick={this.onPlayStopPattern}>
					<i className={(pattern.playing) ? "fa fa-stop" : "fa fa-play"}></i>
				</div>

	        	<div style={style_name}>{nameIsh}</div>

	            <div style={style_colorlist}>
                    {pattern.colors.map( createColorSwatch, this)}
					{this.state.editing ? <button onClick={this.onAddSwatch} key={99} ><i className="fa fa-plus"></i></button> : ''}
					<div style={style_repeats} onClick={this.onRepeatsClick}>
						<i className="fa fa-repeat">{(pattern.repeats) ? 'x'+pattern.repeats : ''}</i>
					</div>
				</div>


				<div style={style_lockbutton}><i className={pattern.locked ? "fa fa-lock" : ""}></i></div>
				<div style={style_editoptions}>{editOptions}</div>
			</div>
		);
	}
});

module.exports = PatternView;
