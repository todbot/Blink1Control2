
"use strict";

var React = require('react');
var Grid = require('react-bootstrap').Grid;
var Col = require('react-bootstrap').Col;
var Row = require('react-bootstrap').Row;
var Modal = require('react-bootstrap').Modal;
var Button = require('react-bootstrap').Button;

var Form = require('react-bootstrap').Form;
var FormControl = require('react-bootstrap').FormControl;
var FormGroup = require('react-bootstrap').FormGroup;
var ControlLabel = require('react-bootstrap').ControlLabel;
var Radio = require('react-bootstrap').Radio;
var Checkbox = require('react-bootstrap').Checkbox;

var Switch = require('react-bootstrap-switch');

var dialog = require('electron').remote.dialog;

var Blink1SerialOption = require('./blink1SerialOption');

var ScriptForm = React.createClass({
    propTypes: {
        rule: React.PropTypes.object.isRequired,
        allowMultiBlink1: React.PropTypes.bool,
        patterns: React.PropTypes.array,
        onSave: React.PropTypes.func,
        onCancel: React.PropTypes.func,
        onDelete: React.PropTypes.func,
        onCopy: React.PropTypes.func
    },
    getInitialState: function() {
        return {};
    },

    componentWillReceiveProps: function(nextProps) {
        var rule = nextProps.rule;
        this.setState({
            type: rule.type || '',
            enabled: rule.enabled || false,
            name: rule.name || 'new rule',
            actionType: rule.actionType || 'parse-color',
            actOnNew: rule.actOnNew || false,
            // patternId: rule.patternId,
            blink1Id: rule.blink1Id || "0",
            path: rule.path || '',
            intervalSecs: rule.intervalSecs || 10,
            errormsg: ''
         });
    },
    handleClose: function() {
        if( !this.state.path ) {
            this.setState({errormsg: 'Must choose a '+this.state.type});
            return;
        }
        this.props.onSave(this.state);
    },
    openFileDialog: function() {
        var self = this;
        dialog.showOpenDialog(function (filenames) {
            if (filenames === undefined) { return; }
            var filename = filenames[0];
            self.setState({path: filename});
        });
    },
    handleActionType: function(e) {
        var actionType = e.target.value;
        this.setState({actionType:actionType});
    },
    handleBlink1SerialChange: function(blink1Id) {
        this.setState({blink1Id: blink1Id});
    },
    handleInputChange: function(event) {
        var target = event.target;
        var value = target.type === 'checkbox' ? target.checked : target.value;
        var name = target.name;
        this.setState({ [name]: value });
    },
    render: function() {
        var self = this;
        var type = this.state.type;
        var title,pathlabel, pathplaceholder;
        if( type === 'script' ) {
            title = "Script";
            pathlabel = "Script Path";
            pathplaceholder = "Click to choose script";
        }
        if( type === 'file' ) {
            title = "File";
            pathlabel = "File Path";
            pathplaceholder = "Click to choose file path";
        }
        else if( type === 'url' ) {
            title = "URL";
            pathlabel = "URL";
            pathplaceholder = "Enter URL";
        }

        return (
            <div>
                <Modal show={this.props.show} onHide={this.handleClose} >
                    <Modal.Header>
                        <Modal.Title>{title} Settings</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p style={{color: "#f00"}}>{this.state.errormsg}</p>
                        <Form horizontal >
                            <FormGroup controlId="formName" title="rule name in IFTTT config">
                                <Col sm={3} componentClass={ControlLabel}>  Rule Name  </Col>
                                <Col sm={8}>
                                    <FormControl type="text" placeholder="Name of rule on IFTTT"
                                        name="name" value={this.state.name} onChange={this.handleInputChange} />
                                </Col>
                            </FormGroup>
                            <FormGroup controlId="formPath" >
                                <Col sm={3} componentClass={ControlLabel}> {pathlabel}  </Col>
                                <Col sm={8}>
                                    {type==='url'  ?
                                        <FormControl type="text" placeholder={pathplaceholder}
                                            name="path" value={this.state.path} onChange={this.handleInputChange} />
                                    :
                                        <FormControl type="text" placeholder={pathplaceholder} readOnly
                                            name="path" value={this.state.path} onClick={this.openFileDialog}/>
                                    }
                                </Col>
                            </FormGroup>

                            <FormGroup controlId="formInterval" >
                                <Col sm={3} componentClass={ControlLabel}> Check interval </Col>
                                <Col sm={6}>
                                    <FormControl componentClass="select" placeholder="15 seconds"
                                        name="intervalSecs" value={this.state.intervalSecs} onChange={this.handleInputChange} >
                                        <option value="2">2 seconds</option>
                                        <option value="5">5 seconds</option>
                                        <option value="10">10 seconds</option>
                                        <option value="15">15 seconds</option>
                                        <option value="30">30 seconds</option>
                                        <option value="60">1 minute</option>
                                        <option value="360">5 minutes</option>
                                    </FormControl>
                                </Col>
                            </FormGroup>

                            <Grid >
                                <Row><Col xs={2}>
                                    <label> Parse output as </label>
                                </Col><Col xs={4} >
                                    <FormGroup controlId="formActionType" >
                                        <Radio title=""
                                            value="parse-json"
                                            checked={this.state.actionType==='parse-json'}
                                            onChange={this.handleActionType}>
                                            Parse output as JSON (color or pattern)
                                        </Radio>
                                        <Radio title=""
                                            value="parse-pattern"
                                            checked={this.state.actionType==='parse-pattern'}
                                            onChange={this.handleActionType}>
                                            Parse output as pattern name
                                        </Radio>
                                        <Radio title=""
                                            value="parse-color"
                                            checked={this.state.actionType==='parse-color'}
                                            onChange={this.handleActionType}>
                                            Parse output as color
                                        </Radio>
                                    </FormGroup>
                                </Col></Row>
                            </Grid>

                            <FormGroup controlId="formTrigger" >
                                <Col sm={3} componentClass={ControlLabel}> Trigger </Col>
                                <Col sm={8}>
                                    <Checkbox
                                        name="actOnNew" checked={this.state.actOnNew} onChange={this.handleInputChange}>
                                        Trigger on new values only
                                    </Checkbox>
                                </Col>
                            </FormGroup>

                            {!this.props.allowMultiBlink1 ? <div/> :
                                <Blink1SerialOption label="blink(1) to use" defaultText="-use default-"
                                    labelColWidth={3} controlColWidth={3}
                                    serial={this.state.blink1Id} onChange={this.handleBlink1SerialChange}/>}

                        </Form>
                    </Modal.Body>
                    <Modal.Footer>
                        <Row>
                            <Col xs={5}>
                                <Button bsSize="small" bsStyle="danger" onClick={this.props.onDelete} style={{float:'left'}}>Delete</Button>
                                <Button bsSize="small" onClick={this.props.onCopy} style={{float:'left'}}>Copy</Button>
                            </Col>
                            <Col xs={3}>
                                <Switch bsSize="mini" labelText='enabled'
                                    state={this.state.enabled} onChange={(el,enabled)=> this.setState({enabled})} />
                            </Col>
                            <Col xs={4}>
                                <Button bsSize="small" onClick={this.props.onCancel}>Cancel</Button>
                                <Button bsSize="small" onClick={this.handleClose}>OK</Button>
                            </Col>
                        </Row>
                    </Modal.Footer>
              </Modal>
          </div>
        );
    }
});

// <Row><Col xs={2}>
//     <label> Parse output as </label>
// </Col><Col xs={4} style={{border:'0px solid green'}}>
//     <Input title=""
//         type="radio" label="Parse output as JSON" value="parse-json"
//         checked={this.state.actionType==='parse-json'}
//         onChange={this.handleActionType} />
//     <Input
//         type="radio" label="Parse output as pattern name" value="parse-pattern"
//         checked={this.state.actionType==='parse-pattern'}
//         onChange={this.handleActionType} />
//     <Input
//         type="radio" label="Parse output as color" value="parse-color"
//         checked={this.state.actionType==='parse-color'}
//         onChange={this.handleActionType} />
// </Col></Row>
// <Row><Col xs={4} xsOffset={2}>
//     <Input bsSize="small" type="checkbox" label="Trigger on new values only"
//         name="actOnNew" checked={this.state.actOnNew} onChange={this.handleInputChange} />
// </Col></Row>


module.exports = ScriptForm;
