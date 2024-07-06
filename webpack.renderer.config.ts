import type { Configuration } from 'webpack';
import { rules } from './webpack.rules';
import { ForkTsCheckerWebpackPlugin, plugins } from './webpack.plugins';
import path from 'path';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

export const rendererConfig: Configuration = {
  devtool: 'source-map',
  target: 'web',
  module: {
    rules,
  },
  plugins: [
    ...plugins,
    new ForkTsCheckerWebpackPlugin({
      logger: 'webpack-infrastructure',
      typescript: {
        configFile: './src/renderer/tsconfig.json',
      }
    }),
  ],
  resolve: {
    modules: ['./src/renderer', 'node_modules'],
    extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx', '.css'],
    alias: {
      PackageJson: path.resolve(__dirname, './package.json'),
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
