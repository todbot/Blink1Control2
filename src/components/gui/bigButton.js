"use strict";

var React = require('react');
var ReactDOM = require('react-dom');
var Button = require('react-bootstrap').Button;
var Overlay = require('react-bootstrap').Overlay;
var MenuItem = require('react-bootstrap').MenuItem;
var Popover = require('react-bootstrap').Popover;
var Modal = require('react-bootstrap').Modal;
var Tooltip = require('react-bootstrap').Tooltip;


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
	showContextMenu: function(e) {
        console.log("showContextMenu", e); //, "this:",this);
		if( this.props.type === 'sys') { return; } // no context for sys buttons
		this.setState({showContextMenu: true});
		console.log("showContextMenu state:", this.state);
    },
	hideContextMenu: function() {
		this.setState({showContextMenu: false});//  }.bind(this)
	},
	doContextMenu: function(event, eventKey) {
        console.log("doContextMenu: eventKey:",eventKey, this.props.idx  );
		this.hideContextMenu();
		this.props.onEdit(eventKey, this.props.idx);
	},
	render: function() {
		var buttonStyle = { width: 64, height: 64, margin: 5, padding: 3, margin: 3, };
		// var tstyle = { height: 28, border:'1px solid red', color: 'grey', fontSize: "0.8em", wordWrap:'break-word', whiteSpace:'normal'  };
		// var tstyle = { height: 24, display:'flex',justifyContent:'center',alignItems:'center',border:'1px solid red', color: 'grey', fontSize: "0.8em", wordWrap:'break-word', whiteSpace:'normal', verticalAlign:'middle' };
		var tstyle = { height: 24, display:'flex',justifyContent:'center', alignItems:'flex-end',
			color: '#666', fontWeight: '400', fontSize: "0.9em",
			wordWrap:'break-word', whiteSpace:'normal', lineHeight:'85%' };

		var iconContent;
		if( this.props.type === "color" ) {
			buttonStyle.background = this.props.color;
			buttonStyle.color = 'white';
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

		var buttonRef = 'target-' + this.props.type + this.props.idx;
		var self = this;
		// console.log("refs:",self.refs);
//ref={function(ref) { console.log("WHAT, ref=",ref); return self.mybuttonRef = ref; }
		return (
			<span id="booper" ref={buttonRef}>
				<Button style={buttonStyle}
					onClick={this.props.onClick} onContextMenu={this.showContextMenu}>
					{iconContent}<div style={tstyle}>{this.props.name}</div>
				</Button>
				<Overlay
					show={this.state.showContextMenu}
					onHide={this.hideContextMenu}
					rootClose={true}
					container={self.refs[buttonRef]}
					>
					<Popover title="Edit Button" id="editbutton">
						<MenuItem eventKey="setcolor" onSelect={this.doContextMenu}>Set to current color</MenuItem>
						<MenuItem eventKey="setpattern" onSelect={this.doContextMenu}>Set to last pattern</MenuItem>
						<MenuItem eventKey="moveleft" onSelect={this.doContextMenu}>Move button left</MenuItem>
						<MenuItem eventKey="delete" onSelect={this.doContextMenu}>Delete button</MenuItem>
					</Popover>
				</Overlay>
			</span>
			);

		var modalish= (
			<span id="booper">
				<Button style={buttonStyle} ref={function(ref) { console.log("WHAT, ref=",ref); return self.mybuttonRef = ref; }}
					onClick={this.props.onClick} onContextMenu={this.showContextMenu}>
					{iconContent}<div style={tstyle}>{this.props.name}</div>
				</Button>
				<Modal show={this.state.showContextMenu} onHide={this.hideContextMenu} bsSize="small" >
				  <Modal.Header>
					<Modal.Title>Edit Button</Modal.Title>
				  </Modal.Header>
				  <Modal.Body>
					  FUCKKKK.
					  <MenuItem eventKey="setcolor" onSelect={this.doContextMenu}>Set to current color</MenuItem>
					  <MenuItem eventKey="setpattern" onSelect={this.doContextMenu}>Set to last pattern</MenuItem>
					  <MenuItem eventKey="moveleft" onSelect={this.doContextMenu}>Move button left</MenuItem>
					  <MenuItem eventKey="delete" onSelect={this.doContextMenu}>Delete button</MenuItem>
				  </Modal.Body>
			  </Modal>
			</span>
		);
	}
});

//target={function() { return ReactDOM.findDOMNode(this.refs[buttonRef]); }.bind(this) } >

module.exports = BigButton;
