import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'

import apiRoutes from './routes/api/index'
import resource from './routes/resource'

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

        app.use(
            require('webpack-dev-middleware')(compiler, {
                noInfo: true,
                publicPath: webpackConfig.output.publicPath
            })
        )
        app.use(require('webpack-hot-middleware')(compiler))
    } catch (err) {
        console.log(err)
    }
}

app.use('/api', apiRoutes)

// app.use(, ))
app.use('/dist', resource) //for serving files as gzip

app.get(/^((?!(\.js)).)*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', '/dist/index.html'))
})

export default app
