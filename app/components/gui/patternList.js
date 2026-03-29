"use strict";

var React = require('react');
//var update = require('react-addons-update');


var Table = require('react-bootstrap').Table;
var Button = require('react-bootstrap').Button;
var ButtonToolbar = require('react-bootstrap').ButtonToolbar;

var PatternView = require('./patternView');

var log = require('../../logger');

var PatternList = React.createClass({
    //mixins: [
    //	require('react-onclickoutside')
    //],

    getInitialState: function() {
        log.msg("patternList: getInitialState!");
        return {
            patterns: window.electronAPI.patterns.getAllPatterns()
        };
    },
    componentDidMount: function() {
        window.electronAPI.patterns.addChangeListener(this.updatePatternState, "patternList");
    }, // FIXME: Surely there's a better way to do this
    componentWillUnmount: function() {
        window.electronAPI.patterns.removeChangeListener("patternList");
    },
    /** Callback to PatternsService.addChangeListener */
    updatePatternState: function(allpatterns) {
        var patts = allpatterns;
        // log.msg("PatternList.updatePatternState");
        this.setState( {patterns: patts } );
    },

    onAddPattern: function() {
        log.msg("PatternList.onAddPattern");
        window.electronAPI.patterns.newPattern().then(function(p) {
            p.id = 0; // force id regen
            window.electronAPI.patterns.savePattern(p);
        });
    },
    onStopAllPatterns: function() {
        log.msg("PatternList.onStopAllPatterns");
        window.electronAPI.patterns.stopAllPatterns();
    },
    copyPattern: function(patternid) {
        log.msg("PatternList.copyPattern:", patternid);
        var p = window.electronAPI.patterns.getPatternById(patternid);
        p.id = 0; // unset to regen for Api // FIXME:!!!
        p.name = p.name + " (copy)";
        p.system = false;
        p.locked = false;
        window.electronAPI.patterns.savePattern(p);
    },
    deletePattern: function(patternid) {
        log.msg("PatternList.deletePattern:", patternid);
        window.electronAPI.patterns.deletePattern(patternid);
    },

    onPatternUpdated: function(pattern) {
        log.msg("PatternList.onPatternUpdated:", pattern);
        window.electronAPI.patterns.savePattern(pattern);
    },

    render: function() {
        // log.msg("patternList.render",this.state.patterns);

        var createPatternRow = function(patt, idx) {
            return (
                <tr key={patt.id + idx + patt.playing} style={{height:25}}>
                    <td style={{ margin: 0, padding: 0}}>
                        <PatternView
                            pattern={patt}
                            onPatternUpdated={this.onPatternUpdated}
                            onCopyPattern={this.copyPattern}
                            onDeletePattern={this.deletePattern} />
                    </td>
                </tr>
            );
        };

        return (
            <div>
                <ButtonToolbar>
                    <Button onClick={this.onStopAllPatterns} bsSize="xsmall" ><i className="fa fa-stop"></i> stop all</Button>
                    <Button onClick={this.onAddPattern} bsSize="xsmall"  style={{float:'right'}}><i className="fa fa-plus"></i> new pattern</Button>
                </ButtonToolbar>
                <Table hover style={{display:'block', height:280, overflowY:'scroll'}} >
                    <tbody >
                        {this.state.patterns.map( createPatternRow, this )}
                    </tbody>
                </Table>
            </div>
        );
    }


});

module.exports = PatternList;
