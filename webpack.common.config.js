const path = require('path')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')

var config = {
    entry: ['./app/index.js'],
    output: {
        publicPath: '/dist',
        filename: 'bundle.js',
        path: path.resolve(__dirname, './dist')
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-react']
                }
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    loader: 'css-loader',
                    options: {
                        modules: true
                    }
                })
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                query: {
                    name: '[name].[ext]?[hash]'
                }
            }
        ]
    },
    plugins: [
        new ProgressBarPlugin(),
        new ExtractTextPlugin({
            filename: 'bundle.css',
            disable: false,
            allChunks: true
        }),
        new CompressionPlugin({
            test: /\.js(\?.*)?$/i
        }),
        new HtmlWebpackPlugin({
            template: './app/ui/core/index.html',
            filename: './index.html'
        })
    ],
    resolve: {
        extensions: ['.js', '.jsx'],
        alias: {
            app: path.resolve(__dirname, 'app'),
            ui: path.resolve(__dirname, 'app/ui'),
            assets: path.resolve(__dirname, 'app/assets'),
            js: path.resolve(__dirname, 'app/js')
        }
    }
}

module.exports = config
