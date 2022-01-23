const path = require('path');

module.exports = {
    mode: 'development',
    // Apparently this setting is supposed to be slow. So if that causes any
    // issues, it could be set to something else according to
    // https://webpack.js.org/configuration/devtool/
    devtool: 'source-map',
    entry: './src/main.ts',
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node-modules/,
            },
        ],
    },
    resolve: {
        extensions: [ '.ts' ],
    },
    output: {
        filename: 'main.js',
        path: path.resolve(__dirname, 'dist', 'script'),
    },
};
