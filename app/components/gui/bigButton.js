"use strict";

var React = require('react');

var Button = require('react-bootstrap').Button;

var ipcRenderer = require('electron').ipcRenderer;

var tinycolor = require('tinycolor2');

var log = require('../../logger');

var BigButton = React.createClass({
  propTypes: {
    idx: React.PropTypes.number,
    name: React.PropTypes.string.isRequired,
    type: React.PropTypes.string.isRequired,
    iconClass: React.PropTypes.string,
    color: React.PropTypes.string,
    millis: React.PropTypes.number,
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
  },
  buildSerializableMenu: function() {
    var self = this;
    var idx = self.props.idx;
    var items = [];

    items.push({ label: 'Set to current color', action: 'setcolor', arg: idx });

    var patternSubmenu = this.props.patterns.map(function(p) {
      return { label: p.name, action: 'setpattern', arg: p.id };
    });
    items.push({ label: 'Set to pattern', submenu: patternSubmenu });

    if (this.props.serials && this.props.serials.length > 0) {
      var serialItems = [
        { label: 'default', type: 'radio', action: 'setserial', arg: 'default',
          checked: this.props.serial === 'default' || this.props.serial === '' }
      ];
      this.props.serials.forEach(function(s) {
        serialItems.push({ label: s, type: 'radio', action: 'setserial', arg: s,
          checked: self.props.serial === s });
      });
      items.push({ label: 'Assign to device', submenu: serialItems });
    }

    items.push({ label: 'Move button left', action: 'moveleft', arg: idx });
    items.push({ label: 'Delete button', action: 'delete', arg: idx });
    items.push({ label: 'Rename Button', action: 'showEditName', arg: null });

    return items;
  },
  showEditName: function() {
    this.props.onEditName();
  },
  showContextMenu: function(evt) {
    evt.preventDefault(); // don't send click further down
    if (this.props.type === 'sys') { return; } // no context for sys buttons
    var self = this;
    var menuId = 'bigbutton-' + this.props.idx + '-' + Date.now();
    ipcRenderer.once('contextMenuResult:' + menuId, function(event, action, arg) {
      if (action === 'showEditName') {
        self.showEditName();
      } else {
        self.doContextMenu(null, action, arg);
      }
    });
    ipcRenderer.send('showContextMenu', { menuId: menuId, template: self.buildSerializableMenu() });
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
