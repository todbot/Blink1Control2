"use strict";

var React = require('react');

var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;

var moment = require('moment');

var Eventer = require('../../eventer');

var PatternsService = require('../../server/patternsService');

var log = require('../../logger');

var ToolTableList = React.createClass({

    propTypes: {
    	rules: React.PropTypes.array.isRequired,
        // events: React.PropTypes.array.isRequired,
        showForm: React.PropTypes.string.isRequired,
        onEditRule: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            events: []
        }
    },

    componentDidMount: function() {
        Eventer.on('newStatus', this.updateStatus);
    },
    // callback called by event service
    updateStatus: function(statuses) {
        var events = statuses; //log.getEvents();

        if( this.props.showForm ) { return; } //i.e. don't change when we're in edit mode

        this.setState({events: events});

    },

    render: function() {
        var patterns = PatternsService.getAllPatterns();
        var events = this.state.events;

        var createRow = function(rule, index) {
            // var pattid = this.props.rules[index].patternId;
            var patternStr = makePattern(rule);
            var blink1IdStr = makeBlink1IdStr(rule);
            var lastVal = makeLastValue(rule);
            var description = makeDesc(rule);
            var type = rule.type;  type = (type==='ifttt')? 'IFTTT' : type;  // FIXME
            var rowstyle = (rule.enabled) ? {} : { color:"#999" };
            return (
                <tr key={index} style={rowstyle} onDoubleClick={this.props.onEditRule.bind(null,index)} >
                    <td>{rule.name}</td>
                    <td>{description}</td>
                    <td>{type}</td>
                    <td>{patternStr}{blink1IdStr}</td>
                    <td>{lastVal}</td>
                    <td><Button bsSize="xsmall" style={{border:'none'}} onClick={this.props.onEditRule.bind(null,index)} >
                        <i className="fa fa-pencil"></i></Button></td>
                </tr>
            );
//			style={{textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}
        };

        // FIXME: ToolTable should ask the service? to format these descriptions
        var makeDesc = function(rule) {
            if( rule.description ) { return rule.description; }
            var desc = '';
            if( rule.type === 'ifttt' ) {
                desc = rule.type + ':' + rule.name;
            }
            else if( rule.type === 'mail' ) {
                // desc = MailForm.getDescription(rule); // FIXME: this doesnt work
                desc = rule.username +':'+rule.triggerType+':'+rule.triggerVal;
            }
            else if( rule.type === 'script' ) {
                desc = rule.intervalSecs +'s:' + rule.path;
            }
            else if( rule.type === 'file' ) {
                desc = rule.intervalSecs +'s:' + rule.path;
            }
            else if( rule.type === 'url' ) {
                desc = rule.intervalSecs +'s:' + rule.path;
                // desc = rule.path + ' @' +rule.intervalSecs +'s';
            }
            else if( rule.type === 'skype' ) {
                desc = rule.username + ':' + rule.triggerType;
            }
            else if( rule.type === 'slack' ) {
                desc = rule.name;
            }            
            else if( rule.type === 'time' ) {
                if( rule.alarmType === 'countdown' ) {
                    desc = 'countdown to ' + rule.alarmHours +':'+ rule.alarmMinutes;
                }
                else if( rule.alarmType === 'hourly' ) {
                    desc = rule.alarmType + ' @ ' + rule.alarmMinutes + ' minutes';
                } else {
                    desc = rule.alarmType + ' @ ' + rule.alarmHours + ':' + rule.alarmMinutes + ' ' + rule.alarmTimeMode;
                }
            }
            else if( rule.type === 'mqtt' ) {
                desc = rule.topic + "@" + rule.url;
            }
            return desc;
        };
        var makePattern = function(rule) {
            // log.msg("toolTable.render: makePattern:",rule);
            var pattstr = 'unknown';
            if( rule.actionType === 'play-pattern' ) {
                pattstr = PatternsService.getNameForId( rule.patternId );  // just text
                if( !pattstr ) { // if pattern not found
                    pattstr = 'bad pattern';
                   }
            }
            else {
                pattstr = rule.actionType;
            }
            // else if( rule.actionType === 'use-output' ) {
            // }
               return pattstr;
        };
        var makeBlink1IdStr = function(rule) {
            if( rule.blink1Id && rule.blink1Id !== "0" ) {
                return "\nblink1:"+rule.blink1Id ;
            }
            return '';
        };
        var makeLastValue = function(rule) {
            var eventsForMe = events.filter( function(e) {
                return ( (e.source===rule.type && e.id === rule.name) ||
                    (e.source==='ifttt' && rule.type==='ifttt' && e.id === '-default-') );
            });
            var lastEvent = '-not-seen-recently-';
            if( eventsForMe.length ) {
                var myEvent = eventsForMe[eventsForMe.length-1];
                // lastEvent = moment(myEvent.date).fromNow() + ': ' + myEvent.text;
                // lastEvent = <span><i> {moment(myEvent.date).format('LTS') } </i>: {myEvent.text} </span>;
                lastEvent = <span>{myEvent.text} <i style={{fontSize:'90%'}}><br/> @ {moment(myEvent.date).format('LTS') } </i></span>;
            }
            return lastEvent;
        };

        return (
            <div style={{display: "block", overflowY: "scroll", height: 165, border:'1px solid #eee'}}>
                <div style={{padding:10}} hidden={this.props.rules.length}>
                    <h3> Click 'add event source' to begin! </h3>
                </div>
                <Table bordered condensed hover style={{fontSize:"0.9em"}} hidden={this.props.rules.length===0}>
                    <thead>
                        <tr style={{lineHeight:"100%"}}>
                            <th style={{width:140}}>Name</th>
                            <th style={{width:225}}>Description</th>
                            <th style={{width: 30}}>Type</th>
                            <th style={{width:130}}>Pattern</th>
                            <th style={{width:150}}>Last event</th>
                            <th style={{width: 30}}> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.rules.map( createRow, this )}
                    </tbody>
                </Table>
            </div>
        );
    }
});

module.exports = ToolTableList;
