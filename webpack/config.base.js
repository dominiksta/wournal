module.exports = {
  module: {
    rules: [
      { test: /\.js$/, enforce: "pre", use: ["source-map-loader"] },
      { test: /\.ts$/, exclude: /node-modules/, use: 'ts-loader' },
      { test: /\.css$/i, use: ["style-loader", "css-loader"] },
    ],
  },
  resolve: {
    extensions: [ '.js', '.ts', '.json' ],
  },
  node: { __dirname: false, __filename: false },
  // living life on the edge
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
}
