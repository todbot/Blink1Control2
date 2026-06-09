
"use strict";

// Suppress React deprecation warnings from react-bootstrap@0.31 and create-react-class.
// These are harmless on React 18. Remove when those packages are upgraded.
// Uses Object.defineProperty so React 18's internal console patching can't bypass the filter.
// Set to false to see all warnings (useful for checking nothing real is being hidden).
const SUPPRESS_LEGACY_WARNINGS = false;
(function() {
  if (!SUPPRESS_LEGACY_WARNINGS) return;
  const _consoleError = console.error.bind(console);
  const SUPPRESSED = ['string ref', 'contextTypes', 'childContextTypes', 'legacy context',
      'componentWillReceiveProps', 'componentWillMount', 'componentWillUpdate', 'findDOMNode',
      'unsafe-component-lifecycles'];
  const filter = (...args) => {
    const full = args.filter(a => typeof a === 'string').join(' ');
    if (SUPPRESSED.some(w => full.includes(w))) return;
    _consoleError(...args);
  };
  try {
    Object.defineProperty(console, 'error', { get: () => filter, set: () => {}, configurable: false });
  } catch(e) {
    console.error = filter;
  }
})();

// begin requires for webpack
require('../node_modules/bootstrap/dist/css/bootstrap.min.css');
require('../node_modules/bootstrap/dist/css/bootstrap-theme.min.css');
require('../node_modules/font-awesome/css/font-awesome.min.css');
require('../node_modules/react-bootstrap-switch/dist/css/bootstrap3/react-bootstrap-switch.min.css');
// end requires for webpack

var React = require('react');
var { createRoot } = require('react-dom/client');
var createReactClass = require('create-react-class');
React.createClass = createReactClass; // shim for legacy deps (react-bootstrap-switch)

var MenuMaker = require('./menuMaker');
MenuMaker.setupMainMenu();
MenuMaker.setupTrayMenu();

var Blink1ControlView = require('./components/gui/blink1ControlView');
var App = createReactClass({
  render: function() {
    return ( <Blink1ControlView /> );
  }
});
var root = createRoot(document.getElementById('app'));
root.render(<App />);
