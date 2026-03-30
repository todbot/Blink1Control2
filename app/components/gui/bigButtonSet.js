"use strict";

var React = require('react');
var createReactClass = require('create-react-class');
var PropTypes = require('prop-types');

var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;

var log = require('../../logger');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var BigButton = require('./bigButton');


var buttonsUserDefault = [
  { name: "Available", type: "color", color: "#00FF00", millis: 100, ledn: 0 },
  { name: "Busy", type: "color", color: "#ffFF00", millis: 100, ledn: 0},
  { name: "Away", type: "color", color: "#ff0000", millis: 100, ledn: 0 },
  { name: "Meeting", type: "color", color: "#0000ff", millis: 100, ledn: 0 },
  { name: "Out of Office", type: "color", color: "#FFBF00", millis:100, ledn: 0 }
];

var BigButtonSet = createReactClass({
  getInitialState: function() {
    var buttonsUser = window.electronAPI.config.readSettings('bigButtons');
    if( !buttonsUser ) {
      buttonsUser = buttonsUserDefault;
    }
    window.electronAPI.bus.on('playBigButtonUser', this.playBigButtonUser);
    window.electronAPI.bus.on('playBigButtonSys', this.playBigButtonSys);

    // fill out 'millis' field on any buttons that don't have it
    buttonsUser = buttonsUser.map((b) => { if( b.millis == undefined) { b.millis = 100;} return b});

    return {
      buttonsSys: [
        { name: "Color Cycle",  type: "sys", iconClass:"fa fa-spinner fa-2x" },
        { name: "Mood Light",   type: "sys", iconClass:"fa fa-asterisk fa-2x" },
        { name: "Party",        type: "sys", iconClass:"fa fa-bullhorn fa-2x" },
        { name: "Strobe Light", type: "sys", iconClass:"fa fa-bullseye fa-2x" },
        { name: "White",        type: "sys", iconClass:"fa fa-sun-o fa-2x" },
        { name: "Off",          type: "sys", iconClass:"fa fa-power-off fa-2x" }
      ],
      buttonsUser: buttonsUser,
      tempname: '',
      tmpidx:-1
    };
  },
  saveButtons: function(buttonsUserNew) {
    this.setState( {buttonsUser: buttonsUserNew });
    window.electronAPI.config.saveSettings("bigButtons", buttonsUserNew);
    window.electronAPI.bus.emit('bigButtonsUpdated');
  },
  addBigButton: function() {
    var state = window.electronAPI.blink1.getState();
    var blink1id = state.currentBlink1Id;
    var newbut = {
      name: "Big Button "+this.state.buttonsUser.length,
      type: "color",
      color: state.currentColor,
      ledn: state.currentLedn,
      millis: state.currentMillis,
      blink1Id: blink1id
    };
    log.msg("addBigButton: ", newbut);
    var newbuttons = this.state.buttonsUser.concat( newbut );
    this.saveButtons( newbuttons );
  },
  onEdit: function(cmd, idx, arg) {
    var mybuttons = this.state.buttonsUser.concat(); // clone
    if( cmd === 'delete' ) {
      mybuttons.splice( idx,1 );
    }
    else if( cmd === 'moveleft') {
      if( idx > 0 ) {
        var tmpbutton = mybuttons[idx-1];
        mybuttons[idx-1] = mybuttons[idx];
        mybuttons[idx] = tmpbutton;
      }
    }
    else if( cmd === 'setcolor') {
      var state = window.electronAPI.blink1.getState();
      mybuttons[idx] = {
        name: mybuttons[idx].name,
        type:'color',
        color: state.currentColor,
        ledn: state.currentLedn,
        millis: state.currentMillis,
        blink1Id: state.currentBlink1Id
      };
    }
    else if( cmd === 'setserial' ) {
      var button = mybuttons[idx];
      mybuttons[idx] = {
        name: button.name,
        type: button.type,
        color: button.color,
        patternId: button.patternId,
        millis: button.millis,
        ledn: button.ledn,
        blink1Id: arg
      };
    }
    else if( cmd === 'setpattern') {
      var patt = window.electronAPI.patterns.getPatternById(arg);
      var name = patt.name;
      mybuttons[idx] = {
        name: name,
        type:'pattern',
        color: patt.colors[0].rgb,
        patternId: arg
      };
    }
    else if( cmd === 'rename' ) {
      mybuttons[idx].name = arg;
    }
    this.saveButtons( mybuttons );
  },
  handleEditName: function(idx) {
    var button = this.state.buttonsUser[idx];
    this.setState({showEditMenu:true, tempname: button.name, tempidx:idx});
  },
  handleEditClose: function(e) {
    e.preventDefault();
    this.onEdit('rename', this.state.tempidx, this.state.tempname);
    this.hideEditMenu();
  },
  hideEditMenu: function() {
    this.setState({showEditMenu:false});
  },

  setBlink1Color: function(color, millis, ledn, blink1id) {
    ledn = ledn || 0;
    window.electronAPI.blink1.fadeToColor( millis, color, ledn, blink1id );
  },
  playBigButtonUser: function(buttonindex,evt) {
    var button = this.state.buttonsUser[buttonindex];
    if( button ) {
      log.msg("bigButtonSet.playBigButtonUser:", buttonindex, button.name, button.blink1Id, button.ledn);
      if( button.type === 'color' ) {
        this.setBlink1Color( button.color, button.millis, button.ledn, button.blink1Id );
      }
      else if( button.type === 'pattern' ) {
        window.electronAPI.patterns.playPatternFrom( button.name, button.patternId, button.blink1Id );
      }
      window.electronAPI.eventer.addStatus( {type:'trigger', source:'button', id:button.name, text:button.name} );
    }
    else {
      log.msg("bigButtonSet.playBigButtonUser: no button ", buttonindex);
    }
  },
  playBigButtonSys: function(buttonname) {
    var button = this.state.buttonsSys.find( function(b) { return b.name === buttonname; });
    if( !button ) {
      log.msg("bigButtonSet.playBigButtonSys: no button ", buttonname);
      return;
    }
    if( button.name === "White" ) {
      this.setBlink1Color( "#FFFFFF" );
    }
    else if( button.name === "Reset" ) {
      window.electronAPI.blink1.off();
    }
    else if( button.name === "Off" ) {
      window.electronAPI.patterns.stopAllPatterns();
      window.electronAPI.blink1.off();
    }
    else if( button.name === "Color Cycle" ) {
      window.electronAPI.blink1.toyStart('colorcycle');
    }
    else if( button.name === "Mood Light" ) {
      window.electronAPI.blink1.toyStart('moodlight');
    }
    else if( button.name === "Party" ) {
      window.electronAPI.blink1.toyStart('party');
    }
    else if( button.name === "Strobe Light" ) {
      window.electronAPI.blink1.toyStart('strobe');
    }
    window.electronAPI.eventer.addStatus( {type:'trigger', source:'button', id:button.name, text:button.name} );
  },
  handleInputChange: function(event) {
    var target = event.target;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    var name = target.name;
    this.setState({ [name]: value });
  },

  render: function() {
    var self = this;
    var patterns = window.electronAPI.patterns.getAllPatterns();
    var serials = window.electronAPI.blink1.getAllSerials();

    var createBigButtonSys = function(button, index) {
      return (
            <BigButton key={index} name={button.name} type='sys'  iconClass={button.iconClass}
              onClick={this.playBigButtonSys.bind(null, button.name)} idx={index} />
      );
    };
    var createBigButtonUser = function(button, index) {
      return (
            <BigButton key={index} idx={index} name={button.name} type={button.type}
                color={button.color} millis={button.millis} patterns={patterns} serials={serials} serial={button.blink1Id}
                onClick={this.playBigButtonUser.bind(this,index)}
                onEdit={this.onEdit} onEditName={this.handleEditName.bind(this,index)}
                />
      );
    };

    return (
      <div>
        <ButtonToolbar style={{padding: 5}}>
          {this.state.buttonsSys.map(createBigButtonSys, this)}
        </ButtonToolbar>
        <div style={{padding: 5, overflowX:'scroll', overflowY:'hidden'}}>
          <ButtonToolbar style={{width:1500}}>
            {this.state.buttonsUser.map(createBigButtonUser, this)}
            <BigButton key="add" name="add button" type="sys" onClick={this.addBigButton} iconClass="fa fa-eyedropper fa-2x" />
          </ButtonToolbar>
        </div>

        <Modal show={this.state.showEditMenu} onHide={this.handleEditClose} bsSize="small" >
          <Modal.Header closeButton>
          <Modal.Title>Edit Button Name</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form inline onSubmit={this.handleEditClose} >
              <FormControl type="text" placeholder="Enter name"
                 name="tempname" value={this.state.tempname} onChange={this.handleInputChange} />
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button onClick={this.hideEditMenu}>Cancel</Button>
            <Button onClick={this.handleEditClose}>OK</Button>
          </Modal.Footer>
        </Modal>

      </div>
    );
  }
});

module.exports = BigButtonSet;
