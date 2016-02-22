"use strict";

var React = require('react');

// var Grid = require('react-bootstrap').Grid;
// var Row = require('react-bootstrap').Row;
// var Col = require('react-bootstrap').Col;
// var Well = require('react-bootstrap').Well;
// var Form = require('react-bootstrap').Form;
// var Input = require('react-bootstrap').Input;
var Button = require('react-bootstrap').Button;
// var ButtonInput = require('react-bootstrap').ButtonInput;
var ButtonGroup = require('react-bootstrap').ButtonGroup;

var remote = window.require('remote');
var Blink1Service = remote.require('./server/blink1Service');

// var ColorPicker = require('react-color');

var HtmlColorChart = require('./htmlColorChart');
var tinycolor = require('tinycolor2');

var Blink1ColorPicker = React.createClass({
	getInitialState: function() {
		return {
			color: "#33dd33",
			secs: 0.1,
			ledn: 0,
			r: 0,
			g: 1,
			b: 2,
		};
	},
	componentDidMount: function() {
		Blink1Service.addChangeListener( this.updateCurrentColor, "blink1ColorPicker" );
		Blink1Service.fadeToColor(200, this.state.color);
	},
	/**  Callback for Blink1Service notifyChange */
	updateCurrentColor: function(currentColor, colors, ledn) {
		console.log("colorpicker.updateCurrentColor, currentColor",currentColor, "ledn:",ledn);
		var rgb = tinycolor(currentColor).toRgb();
		this.setState( { color: currentColor, ledn: ledn, r: rgb.r, g: rgb.g, b: rgb.b });
	},
	setColorHex: function(color) {
		Blink1Service.fadeToColor( this.state.secs*1000, color, this.state.ledn ); // FIXME: time
	},
	// called by colorpicker
	setColor: function(color) {
		// console.log("colorpicker.setColor",color.hex, this.state.ledn);
		color = '#' + color.hex;
		Blink1Service.fadeToColor( this.state.secs*1000, color, this.state.ledn ); // FIXME: time
		// and the above will call 'fetchBlink1Color' anyway
		// there must be a better way to do this
	},
	// called by ledn buttons
	setLedN: function(n) {
		this.setState({ledn: n});
	},
	handleChangeSecs: function(event) {
		var number = event.target.value;
		this.setState({secs: number});
	},
	handleChangeR: function(event) {
		var number = event.target.value;
		number = ( number < 0 ) ? 0 : (number>255) ? 255 : number;
		// this.setState({r:number});
		var tc = tinycolor({r:number, g:this.state.g, b:this.state.b} );
		this.setColor( {hex:tc.toHex()} );
	},
	handleChangeG: function(event) {
		var number = event.target.value;
		if(isNaN(number)) { console.log("not a number"); return; }
		number = ( number < 0 ) ? 0 : (number>255) ? 255 : number;
		// this.setState({g:number});
		var tc = tinycolor({r:this.state.r, g:number, b:this.state.b} );
		this.setColor( {hex:tc.toHex()} );
	},
	handleChangeB: function(event) {
		var number = event.target.value;
		number = ( number < 0 ) ? 0 : (number>255) ? 255 : number;
		// this.setState({b:number});
		var tc = tinycolor({r:this.state.r, g:this.state.g, b:number} );
		this.setColor( {hex:tc.toHex()} );
	},

	render: function() {
		return (
				<div>
					<HtmlColorChart handleClick={this.setColorHex}/>
						<div className="row" style={{paddingTop:5, fontSize:'0.9em'}}>
							<ButtonGroup vertical className="col-sm-3">
							  <Button onClick={this.setLedN.bind(this, 0)} active={this.state.ledn===0} bsSize="small">LED AB</Button>
							  <Button onClick={this.setLedN.bind(this, 1)} active={this.state.ledn===1} bsSize="small">LED A</Button>
							  <Button onClick={this.setLedN.bind(this, 2)} active={this.state.ledn===2} bsSize="small">LED B</Button>
							</ButtonGroup>
							<table className="col-sm-4" style={{ border:'0px solid #ddd'}}>
								<tbody>
								<tr><td style={{textAlign:'right'}}>R:</td><td>
								<input type="number" min={0} max={255} step={1} size={3}
									className="input" style={{textAlign:'right'}}
		  						    value={this.state.r} onChange={this.handleChangeR}/></td></tr>
								<tr><td style={{textAlign:'right'}}>G:</td><td>
								<input type="number" min={0} max={255} step={1} size={3}
									className="input" style={{textAlign:'right'}}
		  						    value={this.state.g} onChange={this.handleChangeG}/></td></tr>
								<tr><td style={{textAlign:'right'}}>B:</td><td>
								<input type="number" min={0} max={255} step={1} size={3}
									className="input" style={{textAlign:'right'}}
		  						    value={this.state.b} onChange={this.handleChangeB}/></td></tr>
								<tr><td style={{textAlign:'right'}}>hex:</td><td>
							  <input type="text" size={7} className="input" style={{textAlign:'right'}}
								  value={this.state.color} onChange={this.handleChangeB}/></td></tr>
						  </tbody>
						  </table>
						  <div className="col-sm-4">
								time(s):
								<input type="number" className="input" min={0.1} max={10.0} step={0.1} size={3}
									value={this.state.secs} onChange={this.handleChangeSecs} />
						  </div>
						</div>
				</div>
		);
	}
});

module.exports = Blink1ColorPicker;

// <div style={{ display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"}}>
// 	<ColorPicker.default type="sketch" color={this.state.color} onChange={this.setColor} />
// </div>
// <div style={{ display: "inline-block", boxSizing: 'border-box', verticalAlign: "top"}}>
// 	<ButtonGroup vertical>
// 	  <Button onClick={this.setLedN.bind(this, 0)} active={this.state.ledn===0}>LED AB</Button>
// 	  <Button onClick={this.setLedN.bind(this, 1)} active={this.state.ledn===1}>LED A</Button>
// 	  <Button onClick={this.setLedN.bind(this, 2)} active={this.state.ledn===2}>LED B</Button>
// 	</ButtonGroup>
// </div>

// <form horizontal className="col-sm-8">
// 	<Input type="number" label="msec" value={this.state.millis}  onChange={this.handleChangeMillis}
// 		labelClassName="col-sm-6" wrapperClassName="col-sm-6" bsSize="small" />
// </form>
// <form horizontal className="col-sm-8">
// 	<Input type="number" label='R'
// 		labelClassName="col-sm-4" wrapperClassName="col-sm-8" bsSize="small" />
// 	<Input type="number" label='G'
// 		labelClassName="col-sm-4" wrapperClassName="col-sm-8" bsSize="small" />
// 	<Input type="number" label='B'
// 		labelClassName="col-sm-4" wrapperClassName="col-sm-8" bsSize="small" />
// </form>
