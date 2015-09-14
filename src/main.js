"use strict";

var React = require('react');
var Router = require('react-router');
var routes = require('./routes');

var InitializeActions = require('./actions/InitializeActions');

InitializeActions.initApp();

Router.run(routes, function(Handler) {
	React.render( <Handler />, document.getElementById('app'));
});