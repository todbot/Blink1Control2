/*eslint-disable strict */ 

var React = require('react');
//var Header = require('./common/header');
var RouteHandler = require('react-router').RouteHandler;

$ = jQuery = require('jquery');

//<Header /> 
var App = React.createClass({
	render: function() {
		return (
			<div>
				<div className="container-fluid">
					<RouteHandler/>
				</div>
			</div>
		);
	}
});

module.exports = App;
