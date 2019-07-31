import chalk from 'chalk'
import http from 'http'

import { serverPort } from './config'
import app from './application'

process.env.NODE_ENV = process.env.NODE_ENV
    ? process.env.NODE_ENV
    : 'development'

console.log(
    chalk.yellow(
        `\n------ ${process.env.NODE_ENV.toUpperCase()} Build ------\n`
    )
)
http.createServer(app).listen(serverPort, () => {
    console.log(
        `Server API at ${chalk.greenBright(`http://localhost:${serverPort}`)}`
    )
})
