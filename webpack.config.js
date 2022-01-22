const webpack = require('webpack')
const path = require('path')

module.exports = {
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist/umd'),
        filename: 'spec.js',
        library: {
            type: 'umd',
            name: 'spec',
        },
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                options: {
                    transpileOnly: true,
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js', '.json'],
    },
    plugins: [
        new webpack.DefinePlugin({
            process: 'process/browser',
        }),
    ],
}
