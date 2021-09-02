"use strict";

import React from 'react';

import { Tabs } from 'react-bootstrap';
import { Tab } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

import BigButtonSet from './bigButtonSet';
import ToolTable from './toolTable';

import { ipcRenderer } from 'electron';


export default class Blink1TabViews extends React.Component {
  constructor(props)  {
    super(props);
    this.openHelpWindow = this.openHelpWindow.bind(this);
  }

  openHelpWindow() {
    ipcRenderer.send('openHelpWindow');
  }

  render() {
    var tabstyle = {height: 205, padding: 5, margin: 0, background: "#fff", border: "solid 1px #ddd"};
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

}
