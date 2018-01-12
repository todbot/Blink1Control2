// html color chart
//stolen from http://html-color-codes.info/

"use strict";

var React = require('react');

var htmlcolors = require('./htmlColorsList');

// var colorChartPng = require('../../images/colorChart.png');
var cw = 12; // cell width
var ch = 13;  // cell height


var HtmlColorChart = React.createClass({
    propTypes: {
        handleClick: React.PropTypes.func,
        currentColor: React.PropTypes.string
    },
    getInitialState: function() {
        return {
            down:false, x:0,y:0, color:'#000000'
        }
    },
    // shouldComponentUpdate: function(nextProps, nextState) {
    //     if (this.props.color !== nextProps.color) {
    //         return true;
    //     }
    //     return false;
    // },
    determineColor: function(x,y) {
      var c = Math.floor(x/cw);
      var r = Math.floor(y/ch);
      var color = htmlcolors[r][c];
      return color;
    },
    getXY: function(evt) {
      var dim = evt.target.getBoundingClientRect();
      var x = evt.clientX - dim.left;
      var y = evt.clientY - dim.top;
      return {x,y};
    },
    sendColor: function(evt) {
        var {x,y} = this.getXY(evt);
        var color = this.determineColor(x,y);
        this.setState({x,y,color});
        this.props.handleClick(color);
    },
    convertXYtoCR: function(x,y) {
        var c = Math.floor(x/cw);
        var r = Math.floor(y/ch);
        return {c,r};
    },
    getXYForColor: function(color) {
        var x=-1, y=-1;
        for( var i=0; i< htmlcolors.length; i++ ) {
            for( var j=0; j< htmlcolors[0].length; j++ ) {
                if( htmlcolors[i][j] === color ) {
                    var x = (j*cw), y = (i*ch);
                    // console.log("match at:",j,i, "=>", (j*cw),(i*ch), "::"); //, self.state.x, self.state.y);
                    return {x,y};
                }
            }
        }
        return {x,y};
    },

    handleColorClick: function(evt) {
        this.setState({down:true});
        this.sendColor(evt);
    },
    handleColorUp: function() {
        this.setState({down:false});
    },
    handleColorMove: function(evt) {
        if( this.state.down ) {
            this.sendColor(evt);
        }
    },
    render: function() {
        var self = this;
        // find closest color box and make outline for it
        var createBoxCoords = function(x,y) {
            if( x === -1 && y===-1 ) {
                return '';
            }
            x = Math.floor(x/cw) * cw + (cw/2);
            y = Math.floor(y/ch) * ch + (ch/2);
            var str = '';
            str +=  (x-7)+','+(y-7)+' ' +  // top left
                    (x+7)+','+(y-7)+' ' +  // top right
                    (x+7)+','+(y+7)+' ' +  // bottom right
                    (x-7)+','+(y+7)+' ' +
                    (x-7)+','+(y-7);  // top left
            return str;
        }
        var {x,y} = self.getXYForColor( this.props.currentColor.toUpperCase() );
        // console.log("currColor:",this.props.currentColor, "xy:",x,y);
        return (
            <div>
              <div style={{position:'relative', display:'inline-block' }} >
                <img width={600/2} height={390/2} src="images/colorChart.png" alt=""
                  onMouseDown={this.handleColorClick}
                  onMouseMove={this.handleColorMove}
                  onMouseUp  ={this.handleColorUp}
                  style={{display:'block', maxWidth:'100%', height:'auto', WebkitUserDrag:'none'}}
                />
                <svg width={600/2} height={390/2} style={{position:'absolute',top:0, left:0, pointerEvents:'none'}}>
                  <polyline stroke="#bbb" strokeWidth="4" fill="none" points={createBoxCoords(x,y)} />
                </svg>
              </div>
            </div>
        );
    }
});

module.exports = HtmlColorChart;
