"use strict";

var React = require('react');

var _ = require('lodash');

var Pattern = React.createClass({
	propTypes: {
		pattern: React.PropTypes.object.isRequired,
		editing: React.PropTypes.bool,
        onAddSwatch: React.PropTypes.func,
        onSwatchClick: React.PropTypes.func,
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
        this.props.onSwatchClick(this.props.pattern.id, coloridx);
	},

	addSwatch: function() {
		console.log('addSwatch');
        this.props.onAddSwatch(this.props.pattern.id);
	},

	render: function() {
		var pattStyle = { width: 250, height: 36, display: "inline-block" };
		var pattNameStyle = {width: 75, display: "inline-block", padding: 4, margin: 4, textAlign: "right", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "80%" };
        var swatchSetStyle = { width: 115, overflow: "scroll" };
		var swatchStyle = { width: 15, height: 15, border: 0, marginLeft: 1, display: "inline-block", background: "inherit" };
		var addSwatchStyle = { width: 15, height: 15, border: 0, marginLeft: 1, display: "inline-block", background: "inherit" };
		var repeatsStyle = { width: 30, padding: 5, fontSize: "80%", borderStyle: "none", background: "inherit" };

		var repstr = (this.props.pattern.repeats) ? 'x' + this.props.pattern.repeats : '';
		var repeats = <i className="fa fa-repeat">{repstr}</i>;

		// also see: https://facebook.github.io/react/tips/expose-component-functions.html
		var createSwatch = function(color, i) {
			var ss = _.clone(swatchStyle); // dont need this now
			ss.background = color.rgb;
            //ss.border = (i===this.state.activeIdx) ? 1 : 0;
			var boundClick = this.swatchClick.bind(this, i);
			return (
				<button onClick={boundClick} type="button" key={i} style={ss}></button>
			);
		};
		var addSwatchButton = (!this.props.editing) ? '' :
            <button onClick={this.addSwatch} type="button" key={99} style={addSwatchStyle}>
                <i style={{fontSize: "95%"}}>+</i>
            </button>;

		return (
			<span style={pattStyle}>
				<span style={pattNameStyle}>{this.props.pattern.name}</span>
				<span style={swatchSetStyle}>
                    <span style={{ width: 200 }}>
                        {this.props.pattern.colors.map( createSwatch, this)}
                        {addSwatchButton}
                        <button onClick={this.props.onRepeatsClick.bind(null, this.props.pattern.id)}
                        style={repeatsStyle} disabled={!this.props.editing} >{repeats}</button>
                    </span>
                </span>
			</span>
		);
	}
});

module.exports = Pattern;
