// webpack.config.js
var webpack = require('webpack');
var path = require('path');

var config = {
  target: 'electron-renderer',
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
    // new webpack.HotModuleReplacementPlugin({multiStep:true}),
    // new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /de|fr|hu/)  // moment
    // new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    // new webpack.IgnorePlugin(/mqtt.min/),  //
    new webpack.IgnorePlugin(/vertx/),  // for skyweb (maybe not needed anymore?)
    new webpack.DefinePlugin({
      'process.env':{
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        },
      },

      { test: /mqtt\/.*\.js/, use: 'shebang-loader', include: [/node_modules\/mqtt/] },

      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, use: "url-loader?limit=10000&mimetype=application/font-woff" },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, use: "file-loader" },
    ]
  }
};

if( process.env.NODE_ENV === 'development' ) {
    config.output.publicPath = 'http://localhost:8080/build/';
} else {
    config.output.publicPath= './build/';
}

module.exports = config;
