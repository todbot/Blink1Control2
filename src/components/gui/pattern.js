"use strict";

var React = require('react');
var _ = require('lodash');

var _clone = function(item) {
        return JSON.parse(JSON.stringify(item)); //return cloned copy so that the item is passed by value instead of by reference
};

var Pattern = React.createClass({
	propTypes: {
		pattern: React.PropTypes.object.isRequired,
		editing: React.PropTypes.bool,
		onRepeatsClick: React.PropTypes.func
	},
	getInitialState: function() {
		return { 
			activeSwatch: -1
		};
	},

	swatchClick: function(coloridx) {
		this.setState({activeSwatch: coloridx});
		console.log("swatchClick!", this.props.pattern.id, coloridx);
	},

	render: function() {
		var pattStyle = { width: 230, height: 36, display: "inline-block" };
		var pattNameStyle = {width: 75, display: "inline-block", padding: 4, margin: 4, textAlign: "right", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%" };
		var swatchStyle = { width: 16, height: 16 };
		var swatchSetStyle = { width: 115, overflow: "scroll" };
		var repeatsStyle = { width: 30, padding: 5, fontSize: "80%", borderStyle: "none", background: "inherit" };

		var repstr = (this.props.pattern.repeats) ? 'x' + this.props.pattern.repeats : '';
		var repeats = <i className="fa fa-repeat">{repstr}</i>;
		//if( this.props.edting ) {
		//	pattStyle.pointerEvents = "none";
		//}
		// this is kinda nuts, don't fully understand
		// but coding pattern from https://facebook.github.io/react/tips/expose-component-functions.html
		return (
			<span style={pattStyle}>
				<span style={pattNameStyle}>{this.props.pattern.name}</span>
				<span style={swatchSetStyle}>
				<span style={{ width: 200 }}> 
				{this.props.pattern.colors.map( function(color, i) { 
					var ss = _clone(swatchStyle); // dont need this now
					ss.background = color.rgb;
					//if( this.props.editing && this.props.activeSwatch >= 0 ) {
					//	ss.borderStyle = "solid"; ss.borderColor = "red";
					//}
					var boundClick = this.swatchClick.bind(this, i);
					return (
						<button onClick={boundClick} type="button" key={i} style={ss}></button> 
					);
				}, this)}
				</span>
				</span>
				<button onClick={this.props.onRepeatsClick.bind(null, this.props.pattern.id)} style={repeatsStyle}>{repeats}</button>
			</span>
		);
	}
});

module.exports = Pattern;
