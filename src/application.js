import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import moment from 'moment'

import apiRoutes from './routes/api/index'
import resource from './routes/resource'

import mysql from './models/databases/index'

const app = express()

app.enable('trust proxy')
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Hot reloading
if (
    process.env.NODE_ENV &&
    process.env.NODE_ENV.trim().toLowerCase() === 'development'
) {
    try {
        const webpack = require('webpack')
        const webpackConfig = require('../webpack.dev.config')
        const compiler = webpack(webpackConfig)
        const devMiddleware = require('webpack-dev-middleware')
        const hmr = require('webpack-hot-middleware')

        app.use(
            devMiddleware(compiler, {
                noInfo: true,
                publicPath: webpackConfig.output.publicPath
            })
        )
        app.use(hmr(compiler))
    } catch (err) {
        console.log(err)
    }
}

app.use('/api', apiRoutes)
app.use('/dist', resource) //for serving bundle.js as gzip and other files

app.get('/health', async (req, res) => {
    let mysqlConnectivity = await mysql.validity()

    res.send({
        time: moment().format('YYYY/MM/DD HH:mm:ss'),
        MySQL: mysqlConnectivity
    })
    return
})

app.get(/^((?!(\.js)).)*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/dist/index.html'))
})

export default app
