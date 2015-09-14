"use strict";

var React = require('react');

var ButtonToolbar = require('react-bootstrap').ButtonToolbar;
var ButtonGroup = require('react-bootstrap').ButtonGroup;
var Button = require('react-bootstrap').Button;
var Glyphicon = require('react-bootstrap').Glyphicon;
var Grid = require('react-bootstrap').Grid;
var Row = require('react-bootstrap').Row;
var Col = require('react-bootstrap').Col;

var ColorPicker = require('react-color');
//var ColorPickr = require('react-colorpickr');
// react-colorpickr gives babelify error

var About = React.createClass({

	getInitialState: function() {
		return {
			myColor: '#ff00ff'
		};
	},

	handleColor: function(color) {
		console.log("color=", color);
		this.setState({myColor: color.hex});
	},

	render: function() {
		return (
			<div>
				<h1> About </h1>
				<p>
					This application uses the following technologies:
					<ul>
					<li>React</li>
					<li>React Router</li>
					<li>Flux</li>
					<li>Node</li>
					<li>Gulp</li>
					<li>Browserify</li>
					<li>Bootstrap</li>
					</ul>

					<h3>buttontoolbar</h3>
					<ButtonToolbar>
						<Button className='btn-info' bsSize='xsmall'>xsmall button</Button>
						<Button className='toast-container' bsSize='xsmall'>xsmall button</Button>
						<Button bsSize='xsmall'>Extra small button</Button>
					</ButtonToolbar>

					<h3>buttongroup</h3>
					<ButtonGroup bsSize='xsmall'>
						<Button><Glyphicon glyph='cog' /></Button>
						<Button><Glyphicon glyph='minus' /></Button>
						<Button><Glyphicon glyph='plus' /></Button>
						<Button><Glyphicon glyph='play' /></Button>
					</ButtonGroup>

					<h3>color</h3>
					<Grid>
					<Row><Col md={4}>
					<ColorPicker type="compact" color={this.state.myColor} onChange={this.handleColor} />
					</Col><Col md={5}>
					<ColorPicker type="slider" color={this.state.myColor} onChange={this.handleColor} />
					</Col></Row>
					<Col>
					<ColorPicker type="sketch" />
					</Col>
					</Grid>
					<div>

					</div>

				</p>
			</div>
		);
	}
});

module.exports = About; 
