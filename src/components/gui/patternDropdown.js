/**
 * Show a drop-down list of available patterns
 *
 */

 "use strict";

var React = require('react');
var _ = require('lodash');

var DropdownButton = require('react-bootstrap').DropdownButton;
var MenuItem = require('react-bootstrap').MenuItem;

var PatternDropdown = React.createClass({

	propTypes: {
		patterns: React.PropTypes.array.isRequired,
        patternId: React.PropTypes.string.isRequired,
        onPatternUpdated: React.PropTypes.func.isRequired
	},

    onSelect: function(eventkey) { //
        this.props.onPatternUpdated(this.props.patterns[eventkey].id);
    },

    render: function() {
        var createMenuItem = function(item, idx) {
            return (
                <MenuItem key={idx} eventKey={idx}>{item.name}</MenuItem>
            );
        };
        var pattern = _.find(this.props.patterns, {id: this.props.patternId});
        var patternName = (pattern) ? pattern.name : this.props.patterns[0].name;

        return (
            <div>
                <DropdownButton bsSize="xsmall" title={patternName}
                    onSelect={this.onSelect}>
                    {this.props.patterns.map( createMenuItem, this )}
                </DropdownButton>
            </div>
        );
    }
});

module.exports = PatternDropdown;
