import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { ForkTsCheckerWebpackPlugin, plugins } from './webpack.plugins';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

export const rendererConfig: Configuration = {
  devtool: 'source-map',
  target: 'web',
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
      }
    ],
  },
  plugins: [
    ...plugins,
    new CopyWebpackPlugin({ patterns: [{
      from: './src/renderer/res/pdf-js-annotation-layer',
      to: 'res/pdf-js-annotation-layer'
    }]}),
  ],
  optimization: process.env.NODE_ENV !== 'development' ? {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        // mvui's component registration can be done via strings, but its much
        // more convenient to use the class names
        keep_classnames: true,
      },
    })],
  } : {},
  resolve: {
    modules: ['./src/renderer', 'node_modules'],
    extensions: [
      '.js', '.mjs', '.ts', '.jsx', '.tsx',
      '.css',
      '.svg', '.png', '.jpg', '.jpeg', '.gif',
      '.wasm',
    ],
    alias: {
      PackageJson: path.resolve(__dirname, './package.json'),
      Shared: path.resolve(__dirname, './src/shared'),
    },
    fallback: {
      'path': require.resolve('path-browserify'),
      'stream': require.resolve('stream-browserify'),
      'fs': false,
    }
  },
  node: { __dirname: false, __filename: true },
  // living life on the edge
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
};
