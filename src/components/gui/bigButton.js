"use strict";

var React = require('react');
var Button = require('react-bootstrap').Button;
//var Glyphicon = require('react-bootstrap').Glyphicon;

var BigButton = React.createClass({
	propTypes: {
		name: React.PropTypes.string.isRequired,
		type: React.PropTypes.string.isRequired,
		color: React.PropTypes.string,
		onClick: React.PropTypes.func,
		onContextMenu: React.PropTypes.func
	},
/*
    contextMenu: function(e) {
        e.preventDefault();
        // Do something here....
        console.log('bigButton: right click');
    },

*/
	render: function() {
		var buttstyle = { width: 64, height: 64, margin: 5 };
		var tstyle = { color: 'grey', fontSize: "0.8em" };
		var iconContent;
		if( this.props.type === "color" ) {
			buttstyle.background = this.props.color;
			buttstyle.color = 'white';
			//iconContent = <i className="fa fa-play-circle-o fa-2x"></i>;
			iconContent = <i className="fa fa-lightbulb-o fa-2x"></i>;
		}
		else if( this.props.type === "sys") {  // FIXME: seems hacky, must be better way surely
			if( this.props.name === "White") {
				iconContent = <i className="fa fa-sun-o fa-2x"></i>;
			}
			else if( this.props.name === "Strobe Light" ) {
				iconContent = <i className="fa fa-bullseye fa-2x"></i>;
			}
			else if( this.props.name === "Color Cycle") {
				iconContent = <i className="fa fa-spinner fa-2x"></i>;
			}
			else if( this.props.name === "Mood Light") {
				iconContent = <i className="fa fa-asterisk fa-2x"></i>;
			}
			else if( this.props.name === "Off") {
				iconContent = <i className="fa fa-power-off fa-2x"></i>;
			}
			else {
				iconContent = <i className="fa fa-eyedropper fa-2x"></i>;
			}
		}
		else if( this.props.type === "add" ) {
			iconContent = <i className="fa fa-plus fa-2x"></i>;
		}
		return (
			<Button style={buttstyle}
				onClick={this.props.onClick} onContextMenu={this.props.onContextMenu}>
				{iconContent}<br /><i style={tstyle}>{this.props.name}</i>
			</Button>
			);
	}
});


module.exports = BigButton;
