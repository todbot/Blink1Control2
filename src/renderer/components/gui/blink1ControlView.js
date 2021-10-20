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
      width: 330, height: 365, margin: 0, marginTop:5, marginRight:5, padding: 0,
      display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"};
    const panelRstyle = {
      width: 370, height: 365, margin: 0, marginTop:5, marginRight:5, padding: 0,
      display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"};
    const windowStyle = {
      height: "100%", width:"100%",
      //overflow: "hidden",
      background: "#f0f0f0", margin: 0, padding: 5, paddingRight:0, WebkitUserSelect: "none"
      // width: 1020, height: 650,
      // overflow: "auto",
    }

    // return (
    //   <div style={windowStyle}>
    //
    //     <div style={{padding:0,margin:0}}>
    //       <div style={{width:290, padding:0,margin:0}} >
    //         <Blink1Status />
    //         <EventList />
    //       </div>
    //       <div style={{width:720, padding:0,margin:0, float:"right"}}>
    //         <div>
    //           <div>
    //             <Blink1TabViews />
    //           </div>
    //           <div>
    //             <Panel style={panelLstyle}>
    //               <Panel.Heading>
    //                 <Panel.Title > Color Picker </Panel.Title>
    //               </Panel.Heading>
    //               <Panel.Body>
    //                   <Blink1ColorPicker />
    //               </Panel.Body>
    //             </Panel>
    //             <Panel style={panelRstyle}>
    //               <Panel.Heading>
    //                 <Panel.Title > Color Patterns </Panel.Title>
    //               </Panel.Heading>
    //               <Panel.Body>
    //                  <PatternList />
    //               </Panel.Body>
    //             </Panel>
    //           </div>
    //         </div>
    //       </div>
    //
    //     </div>
    //
    //   </div>
    // )

    return (
      <Grid style={windowStyle}>
          <Row style={{padding:0,margin:0}}>
            <Col md={3} style={{width:290, padding:0,margin:0}}>
              <Blink1Status />
              <EventList />
            </Col>
            <Col md={8} style={{width:720, padding:0,margin:0,float:"left"}}>
              <Grid fluid>
                <Row>
                  <Blink1TabViews />
                </Row>
                <Row>
                  <Panel style={panelLstyle}>
                    <Panel.Heading>
                      <Panel.Title > Color Picker </Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                        <Blink1ColorPicker />
                    </Panel.Body>
                  </Panel>
                  <Panel style={panelRstyle}>
                    <Panel.Heading>
                      <Panel.Title > Color Patterns </Panel.Title>
                    </Panel.Heading>
                    <Panel.Body>
                       <PatternList />
                    </Panel.Body>
                  </Panel>
                </Row>
              </Grid>
            </Col>
          </Row>
      </Grid>
    );
  }

}

// <Row>
//     <Panel header="Color Picker" style={panelLstyle}>
//         <Blink1ColorPicker />
//     </Panel>
//     <Panel header="Color Patterns" style={panelRstyle}>
//         <PatternList />
//     </Panel>
// </Row>
