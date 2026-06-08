// webpack.config.js
var webpack = require('webpack');
var path = require('path');

var DEV_PORT = require('./app/devPort');

var config = {
  target: 'web',
  performance: { hints: false }, // bundle size limits don't apply to Electron (loads from disk, not network)
  cache: { type: 'filesystem' },
  node: { global: true }, // webpack 4 injected this shim by default; webpack 5 does not
  context: path.join(__dirname, '/app'),
  entry: './maingui.js',

  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, '/app/build'),
  },
  // webpack 5 no longer auto-polyfills Node core modules for target:'web'
  resolve: {
    fallback: {
      "crypto": require.resolve("crypto-browserify"),
      "buffer": require.resolve("buffer/"),
      "events": require.resolve("events/"),
      "stream": require.resolve("stream-browserify"),
      "string_decoder": require.resolve("string_decoder/"),
      "vm": false,
    }
  },
  // see: https://github.com/chentsulin/webpack-target-electron-renderer/pull/7
  externals: {
    "express": 'commonjs express',
    "node-hid": 'commonjs node-hid',
    'nconf': 'commonjs nconf',
    'xml2js': 'commonjs xml2js' // this is to keep webpack from complaing about optional dep of 'needle'
  },
  plugins: [
    // webpack 5 no longer provides process/Buffer globals; inject them for browser-polyfilled Node modules
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
   //new webpack.IgnorePlugin({ resourceRegExp: /vertx/ }),  // for skyweb (maybe not needed anymore?)
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
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, type: 'asset', parser: { dataUrlCondition: { maxSize: 10 * 1024 } } },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, type: 'asset/resource' },
    ]
  }
};

if( process.env.NODE_ENV === 'development' ) {
    config.devServer = { port: DEV_PORT, static: path.join(__dirname, 'app') };
    config.output.publicPath = 'http://localhost:' + DEV_PORT + '/build/';
} else {
    config.output.publicPath= './build/';
}

module.exports = config;
