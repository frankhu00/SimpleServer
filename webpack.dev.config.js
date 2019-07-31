const merge = require('webpack-merge')
const baseConfig = require('./webpack.common.config.js')
const webpack = require('webpack')

module.exports = merge(baseConfig, {
    mode: 'development',
    entry: ['webpack-hot-middleware/client'],
    plugins: [new webpack.HotModuleReplacementPlugin()]
})
