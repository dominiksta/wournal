const webpack = require('webpack');
const path = require('path');
const { spawn } = require('child_process');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const renderBase = require('./config.renderer.base');

module.exports = {
  ...renderBase,
  mode: 'development',
  output: {
    filename: 'script/main.js',
    path: path.resolve(__dirname, '../public'),
  },
  devServer: {
    hot: true,
    static: path.resolve(__dirname, '../public'),
    host: '127.0.0.1',
    setupMiddlewares(middlewares) {
      console.log('Starting preload.js builder...');
      const preloadProcess = spawn('npm', ['run', 'dev:preload'], {
        shell: true, stdio: 'inherit',
      })
        .on('close', process.exit)
        .on('error', console.error);

      console.log('Starting Main Process...');
      let args = ['run', 'dev:main'];
      if (process.env.MAIN_ARGS) {
        args = args.concat(
          ['--', ...process.env.MAIN_ARGS.matchAll(/"[^"]+"|[^\s"]+/g)].flat(),
        );
      }
      spawn('npm', args, {shell: true, stdio: 'inherit'})
        .on('close', code => { preloadProcess.kill(); process.exit(code) })
        .on('error', console.error);
      return middlewares;
    },
  },
};
