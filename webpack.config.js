const path = require('path');

module.exports = {
  entry: './src/main.ts',
  output: {
    filename: 'script/main.js',
    path: path.resolve(__dirname, 'public'),
  },
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    hot: true,
    static: path.resolve(__dirname, 'public'),
    host: '127.0.0.1',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: "pre",
        use: ["source-map-loader"],
      },
      {
        test: /\.ts$/,
        exclude: /node-modules/,
        use: 'ts-loader'
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: [ '.js', '.ts' ],
  },
};
