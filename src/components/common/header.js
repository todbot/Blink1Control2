"use strict";

var React = require('react');
var Router = require('react-router');
var Link = Router.Link;

var Header = React.createClass({
	prender: function() {
		return (
			<nav className="navbar navbar-default">
				<div className="container-fluid">
					<div className="navbar-header">
						<Link to="app" className="navbar-brand">
							<img src="images/pluralsight-logo.png" />
						</Link>
					</div>
					<div className="collapse navbar-collapse">
						<ul className="nav navbar-nav">
							<li><Link to="app">Home</Link></li>
							<li><Link to="authors">Authors</Link></li>
							<li><a href="blah">blah</a></li>
							<li><Link to="todtests">TodTests</Link></li>					
						</ul>
					</div>
				</div>
			</nav>
		);
	},

	render: function() {
		return (
			<nav className="navbar navbar-default">
				<div className="container-fluid">
					<Link to="app" className="navbar-brand">
						<img src="images/pluralsight-logo.png" />
					</Link>
					<ul className="nav navbar-nav">
						<li><Link to="app">Home</Link></li>
						<li><Link to="authors">Authors</Link></li>
						<li><Link to="about">About</Link></li>
						<li><Link to="todtests">TodTests</Link></li>
					</ul>
				</div>
			</nav>
		);
	}
});

module.exports = Header;
