const path = require('path');
const webpack = require('webpack');
const base = require('./config.base');

module.exports = {
  ...base,
  mode: 'production',
  target: 'electron-main',
  entry: {
    main: './src/main/main.ts',
    preload: './src/main/preload.ts',
  },
  output: {
    path: path.resolve(__dirname, '../dist/app/main'),
    filename: '[name].js',
    library: { type: 'umd' },
  },
  plugins: [
    new webpack.EnvironmentPlugin({ NODE_ENV: 'production' }),
  ],
  node: { __dirname: false, __filename: false },
  resolve: {
    ...base.resolve,
    modules: [path.resolve(__dirname, '../src/main'), 'node_modules'],
  },
};
