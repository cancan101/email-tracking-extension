// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  config = require('../webpack.config'),
  fs = require('fs'),
  ZipPlugin = require('zip-webpack-plugin');

delete config.chromeExtensionBoilerplate;

config.mode = 'production';

var json = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    path: '../package', // don't save the zip file inside the build directory
    filename: json.name + '-' + json.version + '.zip',
    extension: 'zip',
  })
);

webpack(config, function (err) {
  if (err) throw err;
});
