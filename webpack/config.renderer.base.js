const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const base = require('./config.base');

module.exports = {
  ...base,
  entry: './src/renderer/main.ts',
  target: ['web', 'electron-renderer'],
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    ...base.plugins,
    new HtmlWebpackPlugin({
      filename: path.join('index.html'),
      template: path.resolve(__dirname, '../src/renderer/index.ejs'),
      minify: {
        collapseWhitespace: true,
        removeAttributeQuotes: true,
        removeComments: true,
      },
      isBrowser: false,
      env: process.env.NODE_ENV,
      isDevelopment: process.env.NODE_ENV !== 'production',
    }),
  ],
  resolve: {
    ...base.resolve,
    modules: [path.resolve(__dirname, '../src/renderer'), 'node_modules'],
    alias: {
      PackageJson: path.resolve(__dirname, '../package.json'),
    },
    fallback: {
      'path': require.resolve('path-browserify'),
      'fs': false,
    }
  },
};
