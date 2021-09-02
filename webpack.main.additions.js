const pkg = require('./package.json')
const webpack = require('webpack')

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      PKG_VERSION: JSON.stringify(pkg.version),
      PKG_HOMEPAGE: JSON.stringify(pkg.homepage),
      PKG_BUGS: JSON.stringify(pkg.bugs)
    })
  ]
};
