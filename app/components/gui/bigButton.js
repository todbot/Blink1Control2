"use strict";

var React = require('react');

var Button = require('react-bootstrap').Button;
var Input = require('react-bootstrap').Input;
var Modal = require('react-bootstrap').Modal;

var LinkedStateMixin = require('react-addons-linked-state-mixin');

var remote = require('electron').remote;
var Menu = remote.Menu;
var MenuItem = remote.MenuItem;

var tinycolor = require('tinycolor2');

var log = require('../../logger');

var currentWindow = remote.getCurrentWindow();

var BigButton = React.createClass({
	mixins: [LinkedStateMixin],

	propTypes: {
		name: React.PropTypes.string.isRequired,
		type: React.PropTypes.string.isRequired,
		color: React.PropTypes.string,
		onClick: React.PropTypes.func,
		onEdit: React.PropTypes.func,
		patterns: React.PropTypes.array,
		serials: React.PropTypes.array
	},
	getInitialState: function() {
		return {
			name: this.props.name
		};
		// return {name: this.props.name, editName:false};
	},
	componentDidMount: function() {
		// log.msg("BigButton.componentDidMount type:",this.props.type);
		if( this.props.type !== 'sys' ) { this.makeMenu(); }
	},
	menu: null,
	makeMenu: function() {
		// log.msg("BigButton.makeMenu: props:",this.props);
		var self = this;
		var idx = self.props.idx;
		var menu = new Menu();

		// Make pattern menu
		var pattmenu = new Menu();
		this.props.patterns.map( function(p) {
			pattmenu.append( new MenuItem({label:p.name, click	: self.doContextMenu.bind(null,null, 'setpattern', p.id)}) );
		});
		// Make serials menu
		var serialsmenu = null;
		if( this.props.serials && this.props.serials.length > 0 ) {
			serialsmenu = new Menu();
			serialsmenu.append( new MenuItem({label:'-use-default-',
										click: self.doContextMenu.bind(null,null, 'setserial', 'default')}) );
			this.props.serials.map( function(s) {
				serialsmenu.append( new MenuItem({label:s,
										click: self.doContextMenu.bind(null,null, 'setserial', s)}) );
			});
		}
		menu.append(new MenuItem({ label:'Set to current color',
				click: self.doContextMenu.bind(null,null, 'setcolor', idx)})); // fixme
		menu.append(new MenuItem({ label:'Set to pattern',
				submenu: pattmenu} ));
				// click: self.doContextMenu.bind(null,null, 'setpattern', idx)})); // fixme
		if( serialsmenu ) {
			menu.append(new MenuItem({ label:'Assign to device',
				submenu: serialsmenu} ));
		}
		menu.append(new MenuItem({ label:'Move button left',
				click: self.doContextMenu.bind(null,null, 'moveleft', idx)})); // fixme
		menu.append(new MenuItem({ label:'Delete button',
				click: self.doContextMenu.bind(null,null, 'delete', idx)})); // fixme
		menu.append(new MenuItem({ label:'Rename Button',
				click: self.showEditMenu }));
		this.menu = menu;
	},
	showEditMenu: function() {
		this.setState({showEditMenu:true});
	},
	hideEditMenu: function() {
		this.setState({showEditMenu:false});
	},
	handleEditClose: function(e) {
		e.preventDefault();
		log.msg("BigButton.handleEditClose");
		this.props.onEdit('rename', this.props.idx, this.state.name); // FIXME: seems really hacky
		this.hideEditMenu();
	},
	showContextMenu: function() {
		if( this.props.type === 'sys') { return; } // no context for sys buttons
	 	this.menu.popup(currentWindow);
	},
	doContextMenu: function(event, eventKey, arg) {
		log.msg("BigButton.doContextMenu: eventKey:",eventKey, "arg:",arg, "idx:",this.props.idx);
		this.props.onEdit(eventKey, this.props.idx, arg);
	},
	render: function() {
		var buttonStyle = { width: 64, height: 64, padding: 3, margin: 5 };
		// var tstyle = { height: 28, border:'1px solid red', color: 'grey', fontSize: "0.8em", wordWrap:'break-word', whiteSpace:'normal'  };
		// var tstyle = { height: 24, display:'flex',justifyContent:'center',alignItems:'center',border:'1px solid red', color: 'grey', fontSize: "0.8em", wordWrap:'break-word', whiteSpace:'normal', verticalAlign:'middle' };
		var tstyle = { height: 24, display:'flex',justifyContent:'center', alignItems:'flex-end',
			fontWeight: '400', fontSize: "0.9em",
			wordWrap:'break-word', whiteSpace:'normal', lineHeight:'85%' };

		var iconContent;
		if( this.props.type === "color" ) {
			buttonStyle.background = this.props.color;
			if( tinycolor(buttonStyle.background).isDark() ) {
				buttonStyle.color = '#eee';
			}
			// buttonStyle.color = 'white';
			//iconContent = <i className="fa fa-play-circle-o fa-2x"></i>;
			iconContent = <i className="fa fa-lightbulb-o fa-2x"></i>;
		}
		else if( this.props.type === 'pattern' ) {
			buttonStyle.background = this.props.color; // FIXME: pattern color summary
			buttonStyle.color = 'white';
			//iconContent = <i className="fa fa-play-circle-o fa-2x"></i>;
			iconContent = <i className="fa fa-play-circle-o fa-2x"></i>;
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

		return (
			<div>
				<Button style={buttonStyle} onContextMenu={this.showContextMenu}
					onClick={this.props.onClick} >
					{iconContent}
					<div style={tstyle}>{this.props.name}</div>
				</Button>

				<Modal show={this.state.showEditMenu} onHide={this.hideEditMenu} bsSize="small" >
				  <Modal.Header>
					<Modal.Title>Edit Button Name</Modal.Title>
				  </Modal.Header>
				  <Modal.Body>
					  <form className="form-horizontal" onSubmit={this.handleEditClose} >
						  <Input labelClassName="col-xs-5" wrapperClassName="col-xs-7" bsSize="small"
							  type="text" label="Button Name" valueLink={this.linkState('name')} />
					  </form>
				  </Modal.Body>
				  <Modal.Footer>
					  <Button onClick={this.hideEditMenu}>Cancel</Button>
					  <Button type="submit" onClick={this.handleEditClose}>OK</Button>
				 </Modal.Footer>
			  </Modal>
			</div>
		);
	}
});


module.exports = BigButton;

// var cmstyle = {
// 	position: 'absolute',
// 	backgroundColor: '#EEE',
// 	boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2)',
// 	border: '1px solid #CCC',
// 	borderRadius: 3,
// 	marginLeft: -5,
// 	marginTop: 5,
// 	padding: 10
// };



			// <Overlay
			// 	show={this.state.showContextMenu}
			// 	onHide={this.hideContextMenu}
			// 	rootClose={true}
			// 	container={this}
			// 	target={this.refs.btbar}
			// 	>
			// 	<Popover title="Edit Button" id="editbutton">
			// 		<MenuItem eventKey="setcolor" onSelect={this.doContextMenu}>Set to current color</MenuItem>
			// 		<MenuItem eventKey="setpattern" onSelect={this.doContextMenu}>Set to last pattern</MenuItem>
			// 		<MenuItem eventKey="moveleft" onSelect={this.doContextMenu}>Move button left</MenuItem>
			// 		<MenuItem eventKey="delete" onSelect={this.doContextMenu}>Delete button</MenuItem>
			// 	</Popover>
			// </Overlay>
			//



// var modalish= (
// 	<span id="booper">
// 		<Button style={buttonStyle} ref={function(ref) { console.log("WHAT, ref=",ref); return self.mybuttonRef = ref; }}
// 			onClick={this.props.onClick} onContextMenu={this.showContextMenu}>
// 			{iconContent}<div style={tstyle}>{this.props.name}</div>
// 		</Button>
// 		<Modal show={this.state.showContextMenu} onHide={this.hideContextMenu} bsSize="small" >
// 		  <Modal.Header>
// 			<Modal.Title>Edit Button</Modal.Title>
// 		  </Modal.Header>
// 		  <Modal.Body>
// 			  FUCKKKK.
// 			  <MenuItem eventKey="setcolor" onSelect={this.doContextMenu}>Set to current color</MenuItem>
// 			  <MenuItem eventKey="setpattern" onSelect={this.doContextMenu}>Set to last pattern</MenuItem>
// 			  <MenuItem eventKey="moveleft" onSelect={this.doContextMenu}>Move button left</MenuItem>
// 			  <MenuItem eventKey="delete" onSelect={this.doContextMenu}>Delete button</MenuItem>
// 		  </Modal.Body>
// 	  </Modal>
// 	</span>
// );
