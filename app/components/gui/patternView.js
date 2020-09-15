"use strict";

var React = require('react');

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
            pattern: this.props.pattern,  // this was a clone, why?
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
            PatternsService.playPatternFrom( 'patternView', pattern.id);
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
            this.setState({activeSwatch: coloridx},
                // function called when state is actually updated
                // see https://stackoverflow.com/questions/29490581/react-state-not-updated
                function() {
                    Blink1Service.fadeToColor( acolor.time*1000, acolor.rgb, acolor.ledn );
                });
            // which cause "onColorChanged()" to get called ?
        }
        else {
            // log.msg("color: ", pattern.colors[coloridx]);
            Blink1Service.fadeToColor( acolor.time*1000, acolor.rgb, acolor.ledn );
        }
    },
    // callback for Blink1Service
    onColorChanged: function() {
        // log.msg("PatternView.onColorChanged, editing:",this.state.editing,"activeSwatch:",this.state.activeSwatch,
        // 		"color:", Blink1Service.getCurrentColor().toHexString());
        if( this.state.editing ) {
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
        if( pattern.playing ) {
            PatternsService.stopPattern(pattern.id);
        }
        // FIXME: this addChangeListener is to watch for color picker changes. sigh
        Blink1Service.addChangeListener( this.onColorChanged, "patternView" );
        PatternsService.inEditing = true;
        this.setState( {editing: true });
    },
    onEditDone: function() {
        log.msg("PatternView.onEditDone");
        this.setState( {editing: false, activeSwatch:-1 });
        var pattern = this.state.pattern;
        Blink1Service.removeChangeListener( "patternView" ); // FIXME HACK
        PatternsService.inEditing = false;
        this.props.onPatternUpdated(pattern);
    },
    onLockPattern: function() {
        log.msg("PatternView.onLockPattern");
        var pattern = this.state.pattern;
        pattern.locked = !pattern.locked;
        this.setState({pattern:pattern});
        this.props.onPatternUpdated(pattern);
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
    handleSwatchKeyDown: function(e,i) {
      log.msg("handleSwatchKeyDown", i, e.key)
      if( this.state.editing && (e.key === "Backspace" || e.key === "Delete") ) {
        var pattern = this.state.pattern;
        delete pattern.colors[this.state.activeSwatch];
        this.setState({pattern: pattern});
      }
    },

    render: function() {
        var pattern = this.state.pattern;
        var pid = pattern.id;
        var isEditing = (this.state.editing); // && (patterneditId === pid));

        var editButtStyle = {borderStyle: "none", background: "inherit", display: "inline-block", padding: 2,
            borderLeftStyle: "solid", float: "right" };

        var lockMenuIcon = (pattern.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
        var lockMenuText = (pattern.locked) ? "Unlock pattern" : "Lock pattern";

        var littleButtStyle = {borderStyle:'none', background:'inherit', display:'inline', padding: 0, outline: 'none' };

        var editOptions =
            <DropdownButton style={editButtStyle} title="" id={pid} pullRight >
                <MenuItem eventKey="1" onSelect={this.onEditPattern} disabled={pattern.system || pattern.locked}><i className="fa fa-pencil"></i> Edit pattern</MenuItem>
                <MenuItem eventKey="2" onSelect={this.onLockPattern} disabled={pattern.system}><i className={lockMenuIcon}></i> {lockMenuText}</MenuItem>
                <MenuItem eventKey="3" onSelect={this.onCopyPattern}><i className="fa fa-copy"></i> Copy pattern</MenuItem>
                <MenuItem eventKey="4" onSelect={this.onDeletePattern} disabled={pattern.locked}><i className="fa fa-remove"></i> Delete pattern</MenuItem>
            </DropdownButton>;
        if( isEditing ) {
            editOptions = <Button onClick={this.onEditDone} style={littleButtStyle}><i className="fa fa-check"></i></Button>;
        }

        /// --- begin the flex-ening
        var style_pattern = { width: 320, display:'flex', alignItems:'flex-start' };
        var style_playbutton = { width:20, height:20, marginTop:2 };
        var style_repeats = { flex:'0 0 auto', height:20, marginTop:3, fontSize:'80%' };
        var style_name = { width:100, textAlign:'right', borderRight:'1px grey', marginTop:2, marginRight:2, paddingRight:2,
                             overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'90%' };
        var style_colorlist = { width:170, display:'flex', flexWrap:'wrap', alignItems:'center'};
        var style_colorswatch = { flex:'0 0 auto', width:17, height:17, margin:1, padding:1,
                                    borderWidth:1, borderStyle:'solid', borderRadius:3, borderColor:'#bbb' };
        var style_addswatch = Object.assign({}, style_colorswatch); style_addswatch.display = 'flex'; style_addswatch.justifyContent='center';
        var style_lockbutton={ width:20 };
        var style_editoptions= { width:20 };

        var nameIsh = (isEditing) ? <input type="text" name="name" value={pattern.name} onChange={this.onNameChange} /> :
                                    pattern.name;
        var pidstr = "pattId:"+pid;

        var addSwatchButton = (isEditing) ? <Button onClick={this.onAddSwatch} key={99}
                                                style={style_addswatch}><i className="fa fa-plus"></i></Button> : '';

        var repeats =  <i className="fa fa-repeat">{(pattern.repeats) ? 'x'+pattern.repeats : ''}</i>;
        if( pattern.repeats === 1 ) {
            repeats = <i className="fa fa-long-arrow-right"></i>;
        }

        var createColorSwatch = function(color ,i) {
            var mystyle = Object.assign({}, style_colorswatch); // clone
            mystyle.backgroundColor = color;
            mystyle.background = 'linear-gradient(180deg, ' + color.rgb+', ' + color.rgb+' 50%, ' + color.rgb+' 50%, ' + color.rgb +')';
            if( isEditing && i === this.state.activeSwatch ) {
                 mystyle.borderColor='#333'; mystyle.borderWidth = 3;
            }
            mystyle.outline = 0
            return (
                <div style={mystyle} key={i} tabIndex={-1}
                    onClick={this.onSwatchClick.bind(this, i)}
                    onKeyDown={(e) => this.handleSwatchKeyDown(e,i)}
                    onDoubleClick={this.onSwatchDoubleClick.bind(this,i)}></div>
             );
        };

        return (
            <div style={style_pattern}>

                <div style={style_playbutton} onClick={this.onPlayStopPattern} title="click to try pattern">
                    <i className={(pattern.playing) ? "fa fa-stop" : "fa fa-play"}></i>
                </div>

                <div style={style_name} title={pidstr}>{nameIsh}</div>

                <div style={style_colorlist}>
                    {pattern.colors.map( createColorSwatch, this)}
                    {addSwatchButton}
                    <div style={style_repeats} onClick={this.onRepeatsClick}>
                        {repeats}
                    </div>
                </div>

                <div style={style_lockbutton}><i style={{}} className={pattern.locked ? "fa fa-lock" : ""}></i></div>
                <div style={style_editoptions} title="pattern edit options">{editOptions}</div>
            </div>
        );
    }
});

module.exports = PatternView;
