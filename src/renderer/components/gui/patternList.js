"use strict";

import React from 'react';
import { Table } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { ButtonToolbar } from 'react-bootstrap';

import PatternView from './patternView';

import PatternsService from '../../server/patternsService';

import log  from '../../logger';

export default class PatternList extends React.Component {

    constructor(props)  {
      super(props);
      log.msg("patternList: getInitialState!");
      this.state = {
        patterns: PatternsService.getAllPatterns()
      }
      this.updatePatternState = this.updatePatternState.bind(this);
      this.onAddPattern = this.onAddPattern.bind(this);
      this.onStopAllPatterns = this.onStopAllPatterns.bind(this);
      this.onStopAllPatterns = this.onStopAllPatterns.bind(this);
      this.copyPattern = this.copyPattern.bind(this);
      this.deletePattern = this.deletePattern.bind(this);
      this.onPatternUpdated = this.onPatternUpdated.bind(this);
    }

    componentDidMount() {
        PatternsService.addChangeListener( this.updatePatternState, "patternList" );
    } // FIXME: Surely there's a better way to do this

    componentWillUnmount() {
        PatternsService.removeChangeListener( "patternList" );
    }

    /** Callback to PatternsService.addChangeListener */
    updatePatternState(allpatterns) {
        var patts = allpatterns;
        // log.msg("PatternList.updatePatternState");
        this.setState( {patterns: patts } );
    }

    onAddPattern() {
        log.msg("PatternList.onAddPattern");
        var p = PatternsService.newPattern();
        p.id = 0; // force id regen
        PatternsService.savePattern( p );
    }

    onStopAllPatterns() {
        log.msg("PatternList.onStopAllPatterns");
        PatternsService.stopAllPatterns();
    }

    copyPattern(patternid) {
        log.msg("PatternList.copyPattern:", patternid);
        var p = PatternsService.getPatternById( patternid );
        p.id = 0; // unset to regen for Api // FIXME:!!!
        p.name = p.name + " (copy)";
        p.system = false;
        p.locked = false;
        PatternsService.savePattern( p );
        // this.setState( {editing: true, : p.id } );
    }
    deletePattern(patternid) {
        log.msg("PatternList.deletePattern:", patternid);
        // this.setState( {editing: false} );
        PatternsService.deletePattern( patternid );
    }

    onPatternUpdated(pattern) {
        log.msg("PatternList.onPatternUpdated:", pattern);
        PatternsService.savePattern(pattern);
    }

    render() {
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


}
