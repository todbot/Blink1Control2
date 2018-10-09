"use strict";

var React = require('react');

var Button = require('react-bootstrap').Button;

var remote = require('electron').remote;
var Menu = remote.Menu;
var MenuItem = remote.MenuItem;

var tinycolor = require('tinycolor2');

var log = require('../../logger');

var currentWindow = remote.getCurrentWindow();

var BigButton = React.createClass({
  propTypes: {
    idx: React.PropTypes.number,
    name: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired,
    iconClass: React.PropTypes.string,
    color: React.PropTypes.string,
    onClick: React.PropTypes.func,
    onEdit: React.PropTypes.func,
    onEditName: React.PropTypes.func,
    patterns: React.PropTypes.array,
    serials: React.PropTypes.array,
    serial: React.PropTypes.string
  },
  getInitialState: function() {
    return {
      // tempname: this.props.name  just for
    };
    // return {name: this.props.name, editName:false};
  },
  componentDidMount: function() {
    // log.msg("BigButton.componentDidMount type:",this.props.type);
    // if( this.props.type !== 'sys' ) { this.menu = this.makeMenu(); }
  },
  makeSerialsMenu: function() {
    // Make serials menu
    var serialsmenu = null;
    if( this.props.serials && this.props.serials.length > 0 ) {
      serialsmenu = new Menu();
      serialsmenu.append( new MenuItem({label:'-use-default-',
        click: self.doContextMenu.bind(null,null, 'setserial', 'default')}) );
      this.props.serials.map( function(s) {
        serialsmenu.append( new MenuItem({label:s, type: 'radio',
                                    click: self.doContextMenu.bind(null,null, 'setserial', s),
                                    checked: (self.props.serial === s) }) );
      });
    }
    return serialsmenu;
  },
  makeMenu: function() {
    // log.msg("BigButton.makeMenu: props:",this.props);
    var self = this;
    var idx = self.props.idx;
    var menu = new Menu();

    // Make pattern menu
    var pattmenu = new Menu();
    this.props.patterns.map( function(p) {
      pattmenu.append( new MenuItem({label:p.name, click: self.doContextMenu.bind(null,null, 'setpattern', p.id)}) );
    });

    menu.append(new MenuItem({ label:'Set to current color',
      click: self.doContextMenu.bind(null,null, 'setcolor', idx)})); // fixme
    menu.append(new MenuItem({ label:'Set to pattern',
      submenu: pattmenu} )); // click: self.doContextMenu.bind(null,null, 'setpattern', idx)})); // fixme
    var serialsmenu = self.makeSerialsMenu();
    if( serialsmenu ) {
      menu.append(new MenuItem({ label:'Assign to device',
        submenu: serialsmenu} ));
    }
    menu.append(new MenuItem({ label:'Move button left',
      click: self.doContextMenu.bind(null,null, 'moveleft', idx)})); // fixme
    menu.append(new MenuItem({ label:'Delete button',
      click: self.doContextMenu.bind(null,null, 'delete', idx)})); // fixme
    menu.append(new MenuItem({ label:'Rename Button',
      click: self.showEditName }));
    return menu;
  },
  showEditName: function() {
    this.props.onEditName();
  },
  showContextMenu: function(evt) {
    // log.msg("BigButton:showContextMenu2: menu:",a,"b:",b,"c:",c);
    evt.preventDefault(); // don't send click further down
    if( this.props.type === 'sys' ) { return; } // no context for sys buttons
    var menu = this.makeMenu();
    menu.popup(currentWindow);
  },
  doContextMenu: function(event, eventKey, arg) {
    log.msg("BigButton.doContextMenu: eventKey:",eventKey, "arg:",arg, "idx:",this.props.idx);
    this.props.onEdit(eventKey, this.props.idx, arg);
  },

  render: function() {
    //var buttonStyle = { width: 72, height: 72, padding: 3, margin: 5, textShadow:'none'  };
    var buttonStyle = { width:'100%', textShadow:'none'  };
    // var tstyle = { height: 28, border:'1px solid red', color: 'grey', fontSize: "0.8em", wordWrap:'break-word', whiteSpace:'normal'  };
    // var tstyle = { height: 24, display:'flex',justifyContent:'center',alignItems:'center',border:'1px solid red', color: 'grey', fontSize: "0.8em", wordWrap:'break-word', whiteSpace:'normal', verticalAlign:'middle' };
    var namestyle = { height: 24, display:'flex',justifyContent:'center', alignItems:'flex-end',
      fontWeight: 400, fontSize: "0.9em",
      wordWrap:'break-word', whiteSpace:'normal', lineHeight:'90%' };

    var iconContent;
    if( this.props.type === "color" ) {
      buttonStyle.background = this.props.color;
      if( tinycolor(buttonStyle.background).isDark() ) {
        buttonStyle.color = '#eee';
      }
      iconContent = <i className="fa fa-lightbulb-o fa-2x"></i>;
    }
    else if( this.props.type === 'pattern' ) {
      buttonStyle.background = this.props.color; // FIXME: pattern color summary, see below
      buttonStyle.color = '#000';
      iconContent = <i className="fa fa-play-circle-o fa-2x"></i>;

      // FIXME: idea for doing pattern color summary
      // var patternColors =  ['#ff00ff', '#000000', '#0ff000'];
      // iconContent = <span style={{display:'flex', alignItems:'flex-start'}}>
      //     <i className="fa fa-play-circle-o fa-2x"></i> {patternColors.map(function(c,idx) {
      //         return <span key={idx} style={{flex:'0 0 auto', width:6,height:4, backgroundColor:c}}></span>;
      //     })} </span>;
    }
    else if( this.props.type === "sys") {  // FIXME: seems hacky, must be better way surely
      iconContent = <i className={this.props.iconClass} />;
    }
    else if( this.props.type === "add" ) {
      iconContent = <i className="fa fa-plus fa-2x"></i>;
    }
    var titlestr = (this.props.type !== 'sys') ? "right-click to edit button":"";
    var hasContextMenu = !(this.props.type === 'sys' ); // no context for sys buttons
    //var contextVisible = (hasContextMenu) ? 'visible' : 'hidden';
    var contextButton = (!hasContextMenu) ? null :
      <button style={{ position:'absolute', top:3, right:3, margin:0, padding:0, width:15, height:10,
                  lineHeight:0, color:'#666', background:'transparent', outline:'none',border:'none' }}
        onClick={this.showContextMenu } title="click to edit button"><i className="fa fa-caret-down"></i></button>;

    return (
      // onMouseEnter={() => log.msg("mouseEnter: "+this.props.name)}
      // onMouseLeave={() => log.msg("mouseLeave: "+this.props.name)}
      <div
        style={{position:'relative', width:72, height:72, padding:3, margin:5, display:'inline-block', background:'transparent'}}>
        {contextButton}
      <Button style={buttonStyle} title={titlestr}
          onContextMenu={this.showContextMenu}
          onClick={this.props.onClick}>
          {iconContent}
          <div style={namestyle}>{this.props.name}</div>
      </Button>
      </div>
    );
  }
});

module.exports = BigButton;
