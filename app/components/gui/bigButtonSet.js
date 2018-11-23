"use strict";

var React = require('react');

var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;

var config = require('../../configuration');
var log = require('../../logger');
var Eventer = require('../../eventer');

var Blink1Service = require('../../server/blink1Service');
var PatternsService = require('../../server/patternsService');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var BigButton = require('./bigButton');


var buttonsUserDefault = [
  { name: "Available", type: "color", color: "#00FF00", ledn: 0 },
  { name: "Busy", type: "color", color: "#ffFF00", ledn: 0},
  { name: "Away", type: "color", color: "#ff0000", ledn: 0 },
  { name: "Meeting", type: "color", color: "#0000ff", ledn: 0 },
  { name: "Out of Office", type: "color", color: "#FFBF00", ledn: 0 }
];

var BigButtonSet = React.createClass({
  getInitialState: function() {
    // var self = this;
    var buttonsUser = config.readSettings('bigButtons');
    if( !buttonsUser ) {
      buttonsUser = buttonsUserDefault;
    }
    Eventer.on('playBigButtonUser', this.playBigButtonUser );
    Eventer.on('playBigButtonSys', this.playBigButtonSys );

    return {
      buttonsSys: [
        { name: "Color Cycle",  type: "sys", iconClass:"fa fa-spinner fa-2x" },
        { name: "Mood Light",   type: "sys", iconClass:"fa fa-asterisk fa-2x" },
        { name: "Party",        type: "sys", iconClass:"fa fa-bullhorn fa-2x" },
        { name: "Strobe Light", type: "sys", iconClass:"fa fa-bullseye fa-2x" },
        { name: "White",        type: "sys", iconClass:"fa fa-sun-o fa-2x" },
        // { name: "Reset",        type: "sys", iconClass:"fa fa-undo fa-2x" },
        { name: "Off",          type: "sys", iconClass:"fa fa-power-off fa-2x" }
      ],
      buttonsUser: buttonsUser,
      tempname: '',
      tmpidx:-1
    };
  },
  saveButtons: function(buttonsUserNew) {
    this.setState( {buttonsUser: buttonsUserNew });
    config.saveSettings("bigButtons", buttonsUserNew);
    Eventer.emit('bigButtonsUpdated');
  },
  addBigButton: function() { // FIXME: this is hacky
    var blink1id = Blink1Service.getCurrentBlink1Id();
    var newbut = {
      name: "Big Button "+this.state.buttonsUser.length,
      type: "color",
      color: Blink1Service.getCurrentColor(blink1id).toHexString(),
      ledn: Blink1Service.getCurrentLedN(blink1id),
      blink1Id: blink1id
    };
    log.msg("addBigButton: ", newbut);
    var newbuttons = this.state.buttonsUser.concat( newbut );
    this.saveButtons( newbuttons );
  },
  onEdit: function(cmd, idx, arg) {
    var mybuttons = this.state.buttonsUser.concat(); // clone;
    // var mybuttons = Object.assign({}, this.state.buttonsUser );
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
      mybuttons[idx] = {
        name: mybuttons[idx].name,
        type:'color',
        color: Blink1Service.getCurrentColor().toHexString(),
        ledn: Blink1Service.getCurrentLedN(),
        blink1Id: Blink1Service.getCurrentBlink1Id()
      };
    }
    else if( cmd === 'setserial' ) {
      var button = mybuttons[idx];
      // why do I have to re-create the object?
      // Why can't I just "mybuttons[idx].blink1Id = arg"
      mybuttons[idx] = {
        name: button.name,
        type: button.type,
        color: button.color,
        patternId: button.patternId,
        ledn: button.ledn,
        blink1Id: arg
      };
    }
    else if( cmd === 'setpattern') {
      var patt = PatternsService.getPatternById(arg);
      var name = patt.name;
      // log.msg("setpattern:",patt.colors[0].rgb);
      mybuttons[idx] = {
        name: name,
        type:'pattern',
        color: patt.colors[0].rgb,
        patternId: arg
      };
    }
    else if( cmd === 'rename' ) {
      // this.state.buttonsUser[idx].name = arg;
      mybuttons[idx].name = arg;
    }
    this.saveButtons( mybuttons );
  },
  handleEditName: function(idx) {
    var button = this.state.buttonsUser[idx];
    this.setState({showEditMenu:true, tempname: button.name, tempidx:idx});
  },
  handleEditClose: function(e) {
    e.preventDefault(); // prevent Enter key from reloading page
    // log.msg("BigButtonSet.handleEditNameClose:",this.state.tempname, this.state.tempidx);
    this.onEdit('rename', this.state.tempidx, this.state.tempname);
    this.hideEditMenu();
  },
  hideEditMenu: function() {
    this.setState({showEditMenu:false});
  },

  // internal function used by differnt kinds of buttons
  setBlink1Color: function(color, ledn, blink1id) {
    ledn = ledn || 0; // 0 means all
    // if( blink1id === undefined ) { 
    //   Blink1Service.getAllSerials().map( function(serial,idx) {
    //     Blink1Service.fadeToColor( 100, color, ledn, serial );  // FIXME: millis
    //   });
    // } else { 
    Blink1Service.fadeToColor( 100, color, ledn, blink1id );  // FIXME: millis
    // }
  },
  // playPattern: function(patternid) {
  //     PatternsService.playPatternFrom( patternid );
  // },
  // can be called outside of this class
  playBigButtonUser: function(buttonindex,evt) {
    var button = this.state.buttonsUser[buttonindex];
    if( button ) {
      log.msg("bigButtonSet.playBigButtonUser:", buttonindex, button.name, button.blink1Id, button.ledn);
      if( button.type === 'color' ) {
        this.setBlink1Color( button.color, button.ledn, button.blink1Id ); // FIXME: what about blink1id
      }
      else if( button.type === 'pattern' ) {
        PatternsService.playPatternFrom( button.name, button.patternId, button.blink1Id );
      }
      Eventer.addStatus( {type:'trigger', source:'button', id:button.name, text:button.name} );
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
      Blink1Service.off();  // FIXME: what is reset?
    }
    else if( button.name === "Off" ) {
      PatternsService.stopAllPatterns();
      Blink1Service.off();
    }
    else if( button.name === "Color Cycle" ) {
      Blink1Service.toyStart('colorcycle');
    }
    else if( button.name === "Mood Light" ) {
      Blink1Service.toyStart('moodlight');
    }
    else if( button.name === "Party" ) {
      Blink1Service.toyStart('party');
    }
    else if( button.name === "Strobe Light" ) {
      Blink1Service.toyStart('strobe');
    }
    Eventer.addStatus( {type:'trigger', source:'button', id:button.name, text:button.name} );
  },
  handleInputChange: function(event) {
    var target = event.target;
    var value = target.type === 'checkbox' ? target.checked : target.value;
    var name = target.name;
    this.setState({ [name]: value });
  },

  render: function() {
    var self = this;
    var patterns = PatternsService.getAllPatterns();
    var serials = Blink1Service.getAllSerials();
    
    var createBigButtonSys = function(button, index) { // FIXME: understand bind()
      return (
            <BigButton key={index} name={button.name} type='sys'  iconClass={button.iconClass}
              onClick={this.playBigButtonSys.bind(null, button.name)} idx={index} />
      );
    };
    var createBigButtonUser = function(button, index) { // FIXME: understand bind()
      return (
            <BigButton key={index} idx={index} name={button.name} type={button.type}
                color={button.color} patterns={patterns} serials={serials} serial={button.blink1Id}
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
