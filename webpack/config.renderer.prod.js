const path = require('path');
const base = require('./config.base');
const rendererBase = require('./config.renderer.base');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');


module.exports = {
  ...rendererBase,
  mode: 'production',
  devtool: 'source-map',
  output: {
    filename: 'script/main.js',
    path: path.resolve(__dirname, '../dist/app/renderer'),
    library: { type: 'umd' },
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        // mvui's component registration can be done via strings, but its much
        // more convenient to use the class names
        keep_classnames: true,
      },
    })],
  },
  plugins: [
    ...rendererBase.plugins,
    new CopyPlugin({ patterns: [ { from: 'public', to: '' } ] }),
  ],
};
