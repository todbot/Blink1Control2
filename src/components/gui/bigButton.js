"use strict";

var React = require('react');
var Button = require('react-bootstrap').Button;
var Overlay = require('react-bootstrap').Overlay;
var MenuItem = require('react-bootstrap').MenuItem;
//var Glyphicon = require('react-bootstrap').Glyphicon;

var BigButton = React.createClass({
	propTypes: {
		name: React.PropTypes.string.isRequired,
		type: React.PropTypes.string.isRequired,
		color: React.PropTypes.string,
		onClick: React.PropTypes.func,
		onContextMenu: React.PropTypes.func
	},
	getInitialState: function() {
		return {
			showContextMenu: false
		};
	},
	showContextMenu: function() {
        console.log("showContextMenu boop", this);
		this.setState({showContextMenu: true});
    },
	hideContextMenu: function() {
		this.setState({showContextMenu: false});//  }.bind(this)
	},
	doContextMenu: function(evtkey) {
        console.log("doContextMenu", evtkey, this.props.idx);
		this.hideContextMenu();
		this.props.onEdit(evtkey, this.props.idx);
	},
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
			} else if( this.props.name === "Strobe Light" ) {
				iconContent = <i className="fa fa-bullseye fa-2x"></i>;
			} else if( this.props.name === "Color Cycle") {
				iconContent = <i className="fa fa-spinner fa-2x"></i>;
			} else if( this.props.name === "Mood Light") {
				iconContent = <i className="fa fa-asterisk fa-2x"></i>;
			} else if( this.props.name === "Off") {
				iconContent = <i className="fa fa-power-off fa-2x"></i>;
			} else {
				iconContent = <i className="fa fa-eyedropper fa-2x"></i>;
			}
		}
		else if( this.props.type === "add" ) {
			iconContent = <i className="fa fa-plus fa-2x"></i>;
		}
		var cmstyle = {
			position: 'absolute',
			backgroundColor: '#EEE',
			boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2)',
			border: '1px solid #CCC',
			borderRadius: 3,
			marginLeft: -5,
			marginTop: 5,
			padding: 10
		};
		var targetRef = 'target-' + this.props.type + this.props.idx;

		return (
			<div id="booper">
				<Button style={buttstyle} ref={targetRef}
					onClick={this.props.onClick} onContextMenu={this.showContextMenu}>
					{iconContent}<br /><i style={tstyle}>{this.props.name}</i>
				</Button>
				<Overlay
					rootClose={true}
					show={this.state.showContextMenu}
					onHide={this.hideContextMenu}
					placement="right"
					container={this}
					target={function() { React.findDOMNode(this.refs[targetRef]); }.bind(this) } >
					<div style={cmstyle}>
						<MenuItem eventKey="setcolor" onSelect={this.doContextMenu}>Set to current color</MenuItem>
						<MenuItem eventKey="setpattern" onSelect={this.doContextMenu}>Set to last pattern</MenuItem>
						<MenuItem eventKey="delete" onSelect={this.doContextMenu}>Delete button</MenuItem>
					</div>
				</Overlay>
			</div>
			);
	}
});


module.exports = BigButton;
