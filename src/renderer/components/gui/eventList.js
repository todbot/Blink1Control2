"use strict";

import React from 'react';
import { Panel } from 'react-bootstrap';
import { ListGroup } from 'react-bootstrap';
import { ListGroupItem } from 'react-bootstrap';
import { Button } from 'react-bootstrap';

const BrowserWindow = require('electron').remote.BrowserWindow;

var log = require('../../logger');
var Eventer = require('../../eventer');

const timefmt = new Intl.DateTimeFormat("en" , {timeStyle: "medium"});  // instead of moment

var logWindow;

export default class EventList extends React.Component {
    constructor(props)  {
      super(props);
      this.state = {
        events:[]
      }
      this.updateStatus = this.updateStatus.bind(this);
      this.clearEvents = this.clearEvents.bind(this);
      this.showEventLog = this.showEventLog.bind(this);
    }

    componentDidMount() {
        Eventer.on('newStatus', this.updateStatus);
    }

    updateStatus(statuses) {
        // log.msg("status: ",statuses);
        var events = statuses;
        events = events.filter( function(e) {
            return e.type === 'trigger' || e.type === 'triggerOff';
        });
        this.setState({events:events});
    }

    clearEvents() {
        Eventer.clearStatuses(); // FIXME: only clear display, not log?
        this.setState({events: []});
    }

    // event is format:
    // event = {
    //  date: Date, // time of event as JS Date, if omitted == now
    //  type: 'trigger', 'triggerOff', 'error', 'info'
    //  source: 'ifttt, 'mail', etc. ==  event source 'type'
    //  id: 'red demo'  // event source 'name'
    //  text: 'blah blah'  // text of event
    // }
    showEventLog() {
        var events = this.state.events;
        var info = '';
        info += '<style> table { width:100% } table, th, td { font-size:85%; font-family:sans-serif; padding:5px; border:1px solid grey; border-collapse:collapse; }</style>';
        if( events.length === 0 ) {
            info = 'no events to display';
        } else {
            info += '<table>';
            info += '<tr><th>date</th><th>type</th><th>source</th><th>id</th><th>text</th></tr>';
            events.map( function(e) {
                var humantime = timefmt.format(e.date);
                info += '<tr><td>' + humantime + '</td><td>' + e.type +
                '</td><td>' + e.source + '</td><td>' + e.id + '</td><td>'+ e.text+'</td></tr>';
            });
            info += '</table>';
        }
        if( logWindow ) {
            logWindow.show();
        } else {
            logWindow = new BrowserWindow({
                    title: 'Blink1Control2 Event List',
                    alwaysOnTop: true,
                    autoHideMenuBar: true,
                    height: 300,
                    width: 400,
                    // icon: assets['icon-32'],
                    webPreferences:{ nodeIntegration: false, contextIsolation: true}
                });
            logWindow.on("closed", function() {
                logWindow = null;
            });
        }
        logWindow.loadURL( 'data:text/html,' + info);
    }

    render() {
        // var revevents = this.state.events.concat().reverse();
        const revevents = this.state.events.slice(0).reverse();
        var createEventLine = function(event,index) {
            var humantime = timefmt.format(event.date);
            var source = event.source;
            var id     = event.id;
            var text   = event.text;
            if( text === id ) { text = ''; }  // don't repeat ourselves
            var msg = <span><b>{source}</b> {id} <br/> {text}</span>;
            return (
                <ListGroupItem key={index} style={{lineHeight:"110%", fontSize: "0.85em", textIndent:-10}}><i style={{fontSize:'90%'}}>{humantime}:</i> {msg} </ListGroupItem>
            );
        };
        const header =
            <h4>Recent Events
                <Button bsSize='xsmall' style={{float:'right' }} onClick={this.showEventLog}> Log </Button>
                <Button bsSize='xsmall' style={{float:'right' }} onClick={this.clearEvents}>Clear</Button>
            </h4> ;
        return (
            <Panel style={{ width: 280, height: 305, margin:5, padding:0}}>
            <Panel.Heading style={{padding:5, margin:0}}>
              <Panel.Title>{header}</Panel.Title>
            </Panel.Heading>
            <Panel.Body style={{padding:0}}>
                <ListGroup style={{	height: 240, overflowY: 'scroll', overflowX:'hidden', padding:0, margin:0, marginBottom:10}}>
                {revevents.map(createEventLine, this)}
                </ListGroup>
            </Panel.Body>
            </Panel>
            );
            // <Button bsSize="xsmall"  onClick={this.showAllEvents}>Show all</Button>
    }
}
