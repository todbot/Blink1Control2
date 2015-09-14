"use strict";

var React = require('react');

var Router = require('react-router');
var DefaultRoute = Router.DefaultRoute;
var Route = Router.Route;
var Redirect = Router.Redirect;

var routes = (
	<Route name="app" path="/" handler={require('./components/app')}>
		<DefaultRoute handler={require('./components/tests/todTests')} />
		<Route name="authors" handler={require('./components/authors/authorPage')} />
		<Route name="addAuthor" path="author" handler={require('./components/authors/manageAuthorPage')} />
		<Route name="manageAuthor" path="author/:id" handler={require('./components/authors/manageAuthorPage')} />
		<Route name="about" handler={require('./components/about/aboutPage')} />
		<Route name="todtests" handler={require('./components/tests/todTests')} />
		<Redirect from="about-us" to="about" />
		<Redirect from="awthurs" to="authors" />
		<Redirect from="about/*" to="about" />
	</Route>
);

module.exports = routes;
