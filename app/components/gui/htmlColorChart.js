// html color chart
//stolen from http://html-color-codes.info/

"use strict";

var React = require('react');

var htmlcolors = require('./htmlColorsList');

var HtmlColorChart = React.createClass({
    propTypes: {
        handleClick: React.PropTypes.func,
        currentColor: React.PropTypes.string
    },
    handleColorClick: function(color) { //,f,g) {
        this.props.handleClick(color);
    },
    render: function() {
        var createCell = function(color,i) {
            var w = (i===24) ? 15 : 12;
            var borderCurr = (color.toUpperCase()===this.props.currentColor.toUpperCase())? '2px solid #bbb' : '';
            return (
                <td onMouseDown={this.handleColorClick.bind(null,color)} key={color}
                    style={{width:w, height:13, background:color, border:borderCurr }}></td>
            );
        };
        var createRow = function(colorrow,i) {
            return (<tr key={i}>{colorrow.map(createCell,this)}</tr>);

        };
		return (
            <table style={{borderCollapse:'collapse', border:'1px solid #eee', padding:0 }}>
                <tbody>
                {htmlcolors.map(createRow,this)}
                </tbody>
            </table>
        );
    }
});

module.exports = HtmlColorChart;
