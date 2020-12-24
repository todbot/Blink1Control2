"use strict";

import React from 'react';

import { Panel } from 'react-bootstrap';
import { Grid } from 'react-bootstrap';
import { Row } from 'react-bootstrap';
import { Col } from 'react-bootstrap';

import Blink1Status from './blink1Status';
import EventList from './eventList';
import PatternList from './patternList';
import Blink1TabViews from './blink1TabViews';
import Blink1ColorPicker from './blink1ColorPicker';

export default class Blink1ControlView extends React.Component {

  render() {
    const panelLstyle = {
      width: 330, height: 375, margin: 0, marginTop:5, marginRight:5, padding: 0,
      display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"};
    const panelRstyle = {
      width: 370, height: 375, margin: 0, marginTop:5, marginRight:5, padding: 0,
      display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"};

    return (
      <div style={{ width: 1200, height: 700, background: "#f0f0f0", margin: 0, padding: 10, WebkitUserSelect: "none" }}>
        <div style={{padding:0, margin:0}}>
          <Row>
            <Col md={3}>
              <Blink1Status />
              <EventList />
            </Col>
            <Col md={9}>
              <Grid fluid>
                <Row>
                  <Blink1TabViews />
                </Row>
                <Row>
                  <Panel header="Color Picker" style={panelLstyle}>
                    <Blink1ColorPicker />
                  </Panel>
                  <Panel header="Color Patterns" style={panelRstyle}>
                    <PatternList />
                  </Panel>
                </Row>
              </Grid>
            </Col>
          </Row>
        </div>
      </div>
    );
  }

}

//});

// <Row>
//     <Panel header="Color Picker" style={panelLstyle}>
//         <Blink1ColorPicker />
//     </Panel>
//     <Panel header="Color Patterns" style={panelRstyle}>
//         <PatternList />
//     </Panel>
// </Row>

// export default class Blink1ControlView;
//module.exports = Blink1ControlView;
//export Blink1ControlView;
