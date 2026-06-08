"use strict";

var React = require('react');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');

var Button = require('react-bootstrap').Button;

var log = require('../../logger');

var PatternView = createReactClass({
    propTypes: {
        pattern: PropTypes.object.isRequired,
        onPatternUpdated: PropTypes.func,
        onCopyPattern: PropTypes.func,
        onDeletePattern: PropTypes.func,
    },
    getInitialState: function() {
        return {
            activeSwatch: -1,
            pattern: this.props.pattern,  // this was a clone, why?
            editing: false,
            showMenu: false
        };
    },
    componentWillReceiveProps: function(nextProps) {
        if (!this.state.editing) {
            this.setState({ pattern: nextProps.pattern });
        }
    },
    onToggleMenu: function(e) {
        e.stopPropagation();
        this.setState(function(s) { return { showMenu: !s.showMenu }; });
    },
    onMenuSelect: function(handler, disabled) {
        if (disabled) { return; }
        this.setState({ showMenu: false });
        handler();
    },
    onNameChange: function(event) {
        var field = event.target.name;
        var value = event.target.value;
        log.msg('PatternView.onNameChange field,value', field, value);
        var pattern = this.state.pattern;
        pattern.name = value;
        pattern.id = window.electronAPI.patterns.generateId(pattern);  // regenerate id on name change
        this.setState( {pattern: pattern});
    },
    onAddSwatch: function() {
        // var colors = this.state.pattern.colors;
        var pattern = this.state.pattern;
        log.msg('PatternView.addSwatch prev colors',pattern.colors);
        //this.props.onAddSwatch(this.props.pattern.id);
        var b1state = window.electronAPI.blink1.getState();
        var newcolor = {
            rgb: b1state.currentColor,
            time: b1state.currentMillis / 1000, // FIXME
            ledn: b1state.currentLedn
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
            window.electronAPI.patterns.playPatternFrom('patternView', pattern.id);
        }
        else {
            window.electronAPI.patterns.stopPattern(pattern.id);
        }
    },
    onSwatchDoubleClick: function(coloridx) {
        log.msg("PatternView.onSwatchDOUBLEClick", this.props.pattern.id, "swatch:",coloridx);
        var acolor = this.state.pattern.colors[coloridx];
        window.electronAPI.blink1.fadeToColor(acolor.time*1000, acolor.rgb, acolor.ledn);
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
                    window.electronAPI.blink1.fadeToColor(acolor.time*1000, acolor.rgb, acolor.ledn);
                });
            // which cause "onColorChanged()" to get called ?
        }
        else {
            // log.msg("color: ", pattern.colors[coloridx]);
            window.electronAPI.blink1.fadeToColor(acolor.time*1000, acolor.rgb, acolor.ledn);
        }
    },
    // callback for Blink1Service
    onColorChanged: function() {
        if( this.state.editing ) {
            var b1state = window.electronAPI.blink1.getState();
            var newcolor = {
                rgb: b1state.currentColor,
                time: b1state.currentMillis / 1000, // FIXME
                ledn: b1state.currentLedn
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
            window.electronAPI.patterns.stopPattern(pattern.id);
        }
        // FIXME: this addChangeListener is to watch for color picker changes. sigh
        window.electronAPI.blink1.addChangeListener(this.onColorChanged, "patternView");
        window.electronAPI.patterns.setInEditing(true);
        this.setState({editing: true});
    },
    onEditDone: function() {
        log.msg("PatternView.onEditDone");
        this.setState({editing: false, activeSwatch:-1});
        var pattern = this.state.pattern;
        window.electronAPI.blink1.removeChangeListener("patternView"); // FIXME HACK
        window.electronAPI.patterns.setInEditing(false);
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

    render: function() {
        var pattern = this.state.pattern;
        var pid = pattern.id;
        var isEditing = (this.state.editing); // && (patterneditId === pid));

        var editButtStyle = {borderStyle: "none", background: "inherit", display: "inline-block", padding: 2,
            borderLeftStyle: "solid", float: "right" };

        var lockMenuIcon = (pattern.locked) ? "fa fa-lock" : "fa fa-unlock-alt";
        var lockMenuText = (pattern.locked) ? "Unlock pattern" : "Lock pattern";

        var littleButtStyle = {borderStyle:'none', background:'inherit', display:'inline', padding: 0, outline: 'none' };

        var menuItemStyle = { padding: '4px 12px', cursor: 'pointer', whiteSpace: 'nowrap', listStyle: 'none' };
        var menuItemDisabledStyle = Object.assign({}, menuItemStyle, { opacity: 0.4, cursor: 'default' });
        var editOptions =
            <div style={{position:'relative'}}>
                <button style={editButtStyle} onClick={this.onToggleMenu}><span className="caret"></span></button>
                {this.state.showMenu && <div
                    style={{position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:999}}
                    onClick={() => this.setState({showMenu: false})} />}
                {this.state.showMenu &&
                    <ul style={{position:'absolute', right:0, zIndex:1000, backgroundColor:'#fff',
                                 border:'1px solid #ccc', borderRadius:3, padding:'4px 0', margin:0,
                                 boxShadow:'0 2px 6px rgba(0,0,0,0.2)'}}>
                        <li style={pattern.system || pattern.locked ? menuItemDisabledStyle : menuItemStyle}
                            onClick={() => this.onMenuSelect(this.onEditPattern, pattern.system || pattern.locked)}>
                            <i className="fa fa-pencil"></i> Edit pattern</li>
                        <li style={pattern.system ? menuItemDisabledStyle : menuItemStyle}
                            onClick={() => this.onMenuSelect(this.onLockPattern, pattern.system)}>
                            <i className={lockMenuIcon}></i> {lockMenuText}</li>
                        <li style={menuItemStyle}
                            onClick={() => this.onMenuSelect(this.onCopyPattern, false)}>
                            <i className="fa fa-copy"></i> Copy pattern</li>
                        <li style={pattern.locked ? menuItemDisabledStyle : menuItemStyle}
                            onClick={() => this.onMenuSelect(this.onDeletePattern, pattern.locked)}>
                            <i className="fa fa-remove"></i> Delete pattern</li>
                    </ul>
                }
            </div>;
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
            mystyle.background = 'linear-gradient(180deg, ' + color.rgb+', ' + color.rgb+' 50%, ' + color.rgb+' 50%, ' + color.rgb +')';
            if( isEditing && i === this.state.activeSwatch ) {
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
