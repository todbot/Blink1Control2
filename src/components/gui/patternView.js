"use strict";

var React = require('react');
//var Button = require('react-bootstrap').Button;

var _ = require('lodash');
var Blink1Service = window.require('remote').require('./server/blink1Service');

var PatternView = React.createClass({
	propTypes: {
		pattern: React.PropTypes.object.isRequired,
		editing: React.PropTypes.bool,
		onPatternUpdated: React.PropTypes.func
        //onAddSwatch: React.PropTypes.func,
        //onSwatchClick: React.PropTypes.func,
		//onRepeatsClick: React.PropTypes.func
	},
	getInitialState: function() {
		return {
			activeSwatch: -1,
            id: this.props.pattern.id,
            pattern: this.props.pattern,
            name: this.props.pattern.name,
            colors: this.props.pattern.colors,
            repeats: this.props.pattern.repeats
		};
	},

	onNameChange: function(event) {
        var field = event.target.name;
        var value = event.target.value;
        console.log('field,value', field, value);
        this.setState({name: value});
    },
	onSwatchClick: function(coloridx) {
		console.log("onSwatchClick!", this.props.pattern.id, coloridx);
		this.setState({activeSwatch: coloridx});
        //this.props.onSwatchClick(this.props.pattern.id, coloridx);
	},
	onAddSwatch: function() {
		console.log('addSwatch');
        var colors = this.state.colors;
        //this.props.onAddSwatch(this.props.pattern.id);
		var newcolor = {rgb: Blink1Service.getCurrentColor(), time: 0.23, ledn: 0 };
        colors.push( newcolor );
        this.setState( {colors: colors});
        console.log('addSwatch, colors:', this.state.colors);
	},
	onRepeatsClick: function() {
		console.log("onRepeatsClick");
		var repeats = this.state.repeats;
		repeats++;
		if( repeats > 9 ) { repeats = 0; }
		this.setState({repeats: repeats});
		//this.props.onPatternUpdated();
	},
    onDoneEditing: function() {
		// FIXME: how to do this
    },

	render: function() {
		var pattStyle = { width: 250, display: "inline-block"};
		var pattNameStyle = {width: 75, display: "inline-block", padding: 4, margin: 0, verticalAlign: "middle",
				textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%" };
        var swatchSetStyle = { width: 115, overflow: "scroll" };
		var swatchStyle = { width: 15, height: 15, margin: 0,
			borderWidth: 1, borderColor: "#999", borderStyle: "solid", marginLeft: 1, display: "inline-block",
			background: "inherit" };
		var addSwatchStyle = _.clone(swatchStyle);
         _.assign( addSwatchStyle, { padding: 0 } );
		var repeatsStyle = { width: 30, padding: 5, fontSize: "80%", borderStyle: "none", background: "inherit" };

		var repstr = (this.state.repeats) ? 'x' + this.state.repeats : '';
		var repeats = <i className="fa fa-repeat">{repstr}</i>;

		var nameField = (this.props.editing) ?
			<input style={pattNameStyle} type="text" name="name" value={this.state.name}
				onChange={this.onNameChange} />
			: <span style={{width: 75}}><span style={pattNameStyle}>{this.state.name}</span></span>;

		// also see: https://facebook.github.io/react/tips/expose-component-functions.html
		var createSwatch = function(color, i) {
			var ss = _.clone(swatchStyle); // dont need this now
			ss.background = color.rgb;
            //if( i === this.state.activeSwatch ) { ss.borderWidth = 2; ss.borderColor = "#f33"; }
			return (
				<button onClick={this.onSwatchClick.bind(this, i)} type="button" key={i} style={ss}></button>
			);
		};

		var plusSwatchButton = (!this.props.editing) ? '' :
            <button onClick={this.onAddSwatch} type="button" key={99} style={addSwatchStyle}><i style={{ marginLeft: -4, marginTop: -4, fontSize: "75%"}} className="fa fa-plus"></i></button>;

		return (
            <span style={pattStyle}>
				{nameField}
                <span style={swatchSetStyle}>
                    <span style={{ width: 200 }}>
                        {this.state.colors.map( createSwatch, this)}
                        {plusSwatchButton}
                        <button onClick={this.onRepeatsClick}
                                style={repeatsStyle} disabled={!this.props.editing} >{repeats}</button>
                    </span>
                </span>
            </span>
		);
	}
});

module.exports = PatternView;
