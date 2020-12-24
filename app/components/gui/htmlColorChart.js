// html color chart
//stolen from http://html-color-codes.info/

"use strict";

import React from 'react';

const htmlcolors = require('./htmlColorsList');

// var colorChartPng = require('../../images/colorChart.png');
const cw = 12; // cell width
const ch = 13;  // cell height

class HtmlColorChart extends React.Component {
    constructor(props) {
        super(props);
        this.state = { down:false, x:0,y:0, color:'#000000'};
    }
    // don't do this
    // shouldComponentUpdate(nextProps, nextState) {
    //     if (this.props.color !== nextProps.color) {
    //         return true;
    //     }
    //     return false;
    // }
    determineColor(x,y) {
      let c = Math.floor(x/cw);
      let r = Math.floor(y/ch);
      let color = htmlcolors[r][c];
      return color;
    }
    getXY(evt) {
      const dim = evt.target.getBoundingClientRect();
      let x = evt.clientX - dim.left;
      let y = evt.clientY - dim.top;
      return {x,y};
    }
    sendColor(evt) {
        let {x,y} = this.getXY(evt);
        let color = this.determineColor(x,y);
        this.setState({x,y,color});
        this.props.handleClick(color);
    }
    convertXYtoCR(x,y) {
        let c = Math.floor(x/cw);
        let r = Math.floor(y/ch);
        return {c,r};
    }
    getXYForColor(color) {
        let x=-1, y=-1;
        for( let i=0; i< htmlcolors.length; i++ ) {
            for( let j=0; j< htmlcolors[0].length; j++ ) {
                if( htmlcolors[i][j] === color ) {
                    let x = (j*cw), y = (i*ch);
                    return {x,y};
                }
            }
        }
        return {x,y};
    }
    handleColorClick(evt) {
        this.setState({down:true});
        this.sendColor(evt);
    }
    handleColorUp() {
        this.setState({down:false});
    }
    handleColorMove(evt) {
        if( this.state.down ) {
            this.sendColor(evt);
        }
    }
    render() {
        // find closest color box and make outline for it
        let createBoxCoords = (x,y) => {
            if( x === -1 && y===-1 ) {
                return '';
            }
            x = Math.floor(x/cw) * cw + (cw/2);
            y = Math.floor(y/ch) * ch + (ch/2);
            let str = '';
            str +=  (x-7)+','+(y-7)+' ' +  // top left
                    (x+7)+','+(y-7)+' ' +  // top right
                    (x+7)+','+(y+7)+' ' +  // bottom right
                    (x-7)+','+(y+7)+' ' +
                    (x-7)+','+(y-7);  // top left
            return str;
        }
        let {x,y} = this.getXYForColor( this.props.currentColor.toUpperCase() );
        // console.log("currColor:",this.props.currentColor, "xy:",x,y);
        return (
              <div style={{position:'relative', display:'inline-block' }} >
                <img width={600/2} height={390/2} src="images/colorChart.png" alt=""
                  onMouseDown={this.handleColorClick.bind(this)}
                  onMouseMove={this.handleColorMove.bind(this)}
                  onMouseUp  ={this.handleColorUp.bind(this)}
                  style={{display:'block', maxWidth:'100%', height:'auto', WebkitUserDrag:'none'}}
                />
                <svg width={600/2} height={390/2} style={{position:'absolute',top:0, left:0, pointerEvents:'none'}}>
                  <polyline stroke="#bbb" strokeWidth="4" fill="none" points={createBoxCoords(x,y)} />
                </svg>
              </div>
        );
    }
}

HtmlColorChart.propTypes = {
    handleClick: React.PropTypes.func,
    currentColor: React.PropTypes.string
};

export default HtmlColorChart;
// module.exports = HtmlColorChart;
