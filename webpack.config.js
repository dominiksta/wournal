const path = require('path');

module.exports = {
    mode: 'development',
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
