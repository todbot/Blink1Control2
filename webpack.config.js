// webpack.config.js
var webpack = require('webpack');
var path = require('path');

module.exports = {
  // context: path.join(__dirname, '/src'),
  entry: './src/maingui.js',
  // entry: __dirname + '/src' + './maingui.js',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '/build'),
    publicPath: 'http://localhost:8080/build/'
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
