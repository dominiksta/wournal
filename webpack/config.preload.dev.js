const webpack = require('webpack');
const path = require('path');
const base = require('./config.base');

module.exports = {
  devtool: 'eval-source-map',
  mode: 'development',
  target: 'electron-preload',
  entry: './src/main/preload.ts',
  output: {
    path: path.resolve(__dirname, '../dist/dev-preload'),
    filename: 'preload.js',
    library: { type: 'umd' },
  },
  module: {
    rules: [
      { test: /\.ts$/, exclude: /node-modules/, use: 'ts-loader' },
    ],
  },
  plugins: [
    new webpack.EnvironmentPlugin({ NODE_ENV: 'development' }),
  ],
  watch: true,
  resolve: {
    ...base.resolve,
    modules: [path.resolve(__dirname, '../src/main'), 'node_modules'],
  },
};
