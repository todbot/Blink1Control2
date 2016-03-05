// webpack.config.js
var webpack = require('webpack');
var path = require('path');

var config = {
    target: 'electron',
   context: path.join(__dirname, '/src'),
  // entry: path.join(__dirname, './src/maingui.js'),
  // entry: __dirname + '/src' + './maingui.js',
  entry: './maingui.js',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '/build'),
    // publicPath: 'http://localhost:8080/build/'
  },
  // see: https://github.com/chentsulin/webpack-target-electron-renderer/pull/7
  externals: {
    "express": 'commonjs express',
    "node-hid": 'commonjs node-hid',
    "serialport": 'commonjs serialport'
  },

  module: {
    loaders: [
      {
          test: /\.js|\.jsx$/,
          query: { presets: ['react'] },
          loader: 'babel-loader',
          exclude: /node_modules/
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" }
    ]
  }
};

if( process.env.NODE_ENV === 'development' ) {
    config.output.publicPath = 'http://localhost:8080/build/';
} else {
    config.output.publicPath= '../build/';
    // config.output.publicPath= '../build/';
}

module.exports = config;
