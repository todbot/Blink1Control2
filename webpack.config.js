// webpack.config.js
var webpack = require('webpack');
var path = require('path');

var config = {
    // target: 'atom',
  target: 'electron',
  context: path.join(__dirname, '/app'),
  // entry: path.join(__dirname, './src/maingui.js'),
  // entry: __dirname + '/src' + './maingui.js',
  entry: './maingui.js',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '/app/build'),
    // publicPath: 'http://localhost:8080/build/'
  },
  // see: https://github.com/chentsulin/webpack-target-electron-renderer/pull/7
  externals: {
    "express": 'commonjs express',
    "node-hid": 'commonjs node-hid',
    'nconf': 'commonjs nconf',
    'xml2js': 'commonjs xml2js' // this is to keep webpack from complaing about optional dep of 'needle'
  },
  plugins: [
    //  new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /de|fr|hu/)  // moment
    // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    new webpack.IgnorePlugin(/vertx/)  // for skyweb
  ],
  module: {
      noParse: [
        //   /electron-rebuild/,
        //   /\.json/
      ],
    loaders: [
      {
          test: /\.js|\.jsx$/,
          query: { presets: ['react','es2015'] },
          loader: 'babel-loader',
          exclude: /node_modules/
      },
      { test: /\.css$/, loader: 'style-loader!css-loader' },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=10000&mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
      { test: /\.json$/, loader: "json"}
    ]
  }
};

if( process.env.NODE_ENV === 'development' ) {
    config.output.publicPath = 'http://localhost:8080/build/';
} else {
    config.output.publicPath= './build/';
    // config.output.publicPath= '../build/';
}

module.exports = config;
