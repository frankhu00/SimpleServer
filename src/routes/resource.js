import express from 'express'
import path from 'path'

let router = express.Router()

// Send bundle.js as gzip file if supported
router.get('/bundle.js', (req, res, next) => {
    if (
        req.headers['accept-encoding'] &&
        req.headers['accept-encoding'].indexOf('gzip') > -1
    ) {
        res.set('Content-Encoding', 'gzip')
        res.set('Content-Type', 'text/javascript')
        res.sendFile(
            path.join(
                path.resolve(__dirname),
                '../',
                '../',
                'dist',
                'bundle.js.gz'
            )
        )
    } else {
        res.set('Content-Type', 'text/javascript')
        res.sendFile(
            path.join(
                path.resolve(__dirname),
                '../',
                '../',
                'dist',
                'bundle.js'
            )
        )
    }
})

router.get(/\/.+/, express.static(path.join(__dirname, '..', '..', '/dist')))

module.exports = router
