"use strict";

var React = require('react');
var Panel = require('react-bootstrap').Panel;
var ListGroup = require('react-bootstrap').ListGroup;
var ListGroupItem = require('react-bootstrap').ListGroupItem;
var Button = require('react-bootstrap').Button;

const BrowserWindow = require('@electron/remote').BrowserWindow;

var log = require('../../logger');
var Eventer = require('../../eventer');

var moment = require('moment');

var logWindow;

var EventList = React.createClass({
    propTypes: {
        //events: React.PropTypes.array.isRequired,
        //onClear: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {
            events: []
        };
    },
    componentDidMount: function() {
        Eventer.on('newStatus', this.updateStatus);
    },
    updateStatus: function(statuses) {
        // log.msg("status: ",statuses);
        var events = statuses;
        events = events.filter( function(e) {
            return e.type === 'trigger' || e.type === 'triggerOff';
        });
        this.setState({events:events});
    },

    clearEvents: function() {
        Eventer.clearStatuses(); // FIXME: only clear display, not log?
        this.setState({events: []});
    },

    // event is format:
    // event = {
    //  date: Date, // time of event as JS Date, if omitted == now
    //  type: 'trigger', 'triggerOff', 'error', 'info'
    //  source: 'ifttt, 'mail', etc. ==  event source 'type'
    //  id: 'red demo'  // event source 'name'
    //  text: 'blah blah'  // text of event
    // }
    showEventLog: function() {
        var events = this.state.events;
        var info = '';
        info += '<style> table { width:100% } table, th, td { font-size:85%; font-family:sans-serif; padding:5px; border:1px solid grey; border-collapse:collapse; }</style>';
        if( events.length === 0 ) {
            info = 'no events to display';
        } else {
            info += '<table>';
            info += '<tr><th>date</th><th>type</th><th>source</th><th>id</th><th>text</th></tr>';
            events.map( function(e) {
                var humantime = moment(e.date).format('LTS');
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
                    width: 400
                    // icon: assets['icon-32'],
                });
            logWindow.on("closed", function() {
                logWindow = null;
            });
        }
        logWindow.loadURL( 'data:text/html,' + info);
    },
    render: function() {
        // var revevents = this.state.events.concat().reverse();
        var revevents = this.state.events.slice(0).reverse();
        var createEventLine = function(event,index) {
            var humantime = moment(event.date).format('LTS');
            var source = event.source;
            var id     = event.id;
            var text   = event.text;
            if( text === id ) { text = ''; }  // don't repeat ourselves
            var msg = <span><b>{source}</b> {id} <br/> {text}</span>;
            return (
                <ListGroupItem key={index} style={{lineHeight:"110%", fontSize: "0.85em", textIndent:-10}}><i style={{fontSize:'90%'}}>{humantime}:</i> {msg} </ListGroupItem>
            );
        };
        var header =
            <h4>Recent Events
                <Button bsSize='xsmall' style={{float:'right' }} onClick={this.showEventLog}> Log </Button>
                <Button bsSize='xsmall' style={{float:'right' }} onClick={this.clearEvents}>Clear</Button>
            </h4> ;
        return (
            <Panel header={header} style={{ width: 280, height: 305, margin:5, padding:0}}>
                <ListGroup style={{	height: 240, overflowY: 'scroll', overflowX:'hidden', padding:0, margin:0, marginBottom:10}}>
                {revevents.map(createEventLine, this)}
                </ListGroup>
            </Panel>
            );
            // <Button bsSize="xsmall"  onClick={this.showAllEvents}>Show all</Button>
    }
});

module.exports = EventList;
