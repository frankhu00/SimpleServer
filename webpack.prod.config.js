const webpack = require('webpack')
const merge = require('webpack-merge')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const baseConfig = require('./webpack.common.config.js')

module.exports = merge(baseConfig, {
    mode: 'production',
    stats: {
        colors: true,
        hash: false,
        version: false,
        timings: false,
        assets: false,
        chunks: false,
        modules: false,
        reasons: false,
        children: false,
        source: false,
        errors: false,
        errorDetails: false,
        warnings: false,
        publicPath: false
    },
    plugins: [
        // Minify JS
        new UglifyJsPlugin(),
        // Minify CSS
        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ]
})
