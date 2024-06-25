const { DefinePlugin } = require('webpack');
const { execSync } = require('child_process');

const git = cmd => execSync(`git ${cmd}`, { encoding: 'utf8' }).trim();

module.exports = {
  module: {
    rules: [
      { test: /\.js$/, enforce: "pre", use: ["source-map-loader"] },
      { test: /\.ts$/, exclude: /node-modules/, use: 'ts-loader' },
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: {
    extensions: [ '.js', '.mjs', '.ts', '.json' ],
  },
  plugins: [
    new DefinePlugin({
      'WOURNAL_ENV.production': process.env.NODE_ENV !== 'development',
      'WOURNAL_ENV.gitVersion': JSON.stringify(git('describe --always')),
      'WOURNAL_ENV.buildTime': JSON.stringify(new Date().toISOString()),
    }),
  ],
  node: { __dirname: false, __filename: true },
  // living life on the edge
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
}
