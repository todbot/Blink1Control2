"use strict";

var React = require('react');

var Tabs = require('react-bootstrap').Tabs;
var Tab = require('react-bootstrap').Tab;
var Button = require('react-bootstrap').Button;

var BigButtonSet = require('./bigButtonSet');
var ToolTable = require('./toolTable');

var ipcRenderer = require('electron').ipcRenderer;


var Blink1TabViews = React.createClass({

  openHelpWindow: function() {
    ipcRenderer.send('openHelpWindow');
  },

  render: function() {
    var tabstyle = {height: 215, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"};
    return (
      <div style={{width:705}}>
        <div style={{float:'right'}}><Button bsStyle="link" onClick={this.openHelpWindow}>Help</Button></div>
          <Tabs defaultActiveKey={1} animation={false} id='blink1tabview'  >
            <Tab eventKey={1} title={<span><i className="fa fa-long-arrow-right"></i> Buttons</span>}>
              <div style={tabstyle}>
                <BigButtonSet />
              </div>
            </Tab>
            <Tab eventKey={2} title={<span><i className="fa fa-plug"></i> Event Sources</span>}>
              <div style={tabstyle}>
                <ToolTable />
              </div>
            </Tab>
          </Tabs>
      </div>
    );
  }
});

module.exports = Blink1TabViews;
