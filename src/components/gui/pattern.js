"use strict";

var React = require('react');
var _ = require('lodash');

var pattStyle = { width: 245, height: 36, display: "inline-block" };
var pattNameStyle = {width: 75, display: "inline-block", padding: 4, margin: 4, textAlign: "right", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%" };
var swatchStyle = { width: 16, height: 16 };
var repeatsStyle = { width: 30, padding: 5, fontSize: "80%" };

var _clone = function(item) {
        return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var Pattern = React.createClass({
	propTypes: {
		pattern: React.PropTypes.object.isRequired,
		onPatternChange: React.PropTypes.func,
		handleRepeatsClick: React.PropTypes.func
	},

	swatchClick: function(coloridx) {
		console.log("swatchClick!", this.props.pattern.id, coloridx);
	},
	repeatsClick: function() {
		console.log("repeatsClick!", this.props.pattern.id, this.props.pattern.repeats);
		this.props.pattern.repeats++;  // FIXME: hmmm.
		this.forceUpdate(); // FIXME: hmmm.
	},

	render: function() {
		var repstr = (this.props.pattern.repeats) ? 'x' + this.props.pattern.repeats : '';
		var repeats = <i className="fa fa-repeat">{repstr}</i>;
		var lockedIcon = (this.props.pattern.locked) ? <i className="fa fa-lock"></i> : <i></i>;

		// this is kinda nuts, don't fully understand
		// but coding pattern from https://facebook.github.io/react/tips/expose-component-functions.html
		return (
			<span style={pattStyle}>
				<span style={pattNameStyle}>{this.props.pattern.name}</span>
				{this.props.pattern.colors.map( function(color, i) { 
					var ss = _clone(swatchStyle);
					ss.background = color.rgb;
					var boundClick = this.swatchClick.bind(this, i);
					return (
						<button onClick={boundClick} type="button" key={i} 
						style={ss}></button> 
					);
				}, this)}
				<span onClick={this.repeatsClick} style={repeatsStyle}>{repeats}</span>
				<span style={{float: "right", marginRight: 5, marginTop: 5 }}>{lockedIcon}</span>
			</span>
		);
	}
});

module.exports = Pattern;
