const webpack = require('webpack');
const path = require('path');

module.exports = {
  devtool: 'inline-source-map',
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
};
