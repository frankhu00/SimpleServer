import chalk from 'chalk'

class Notification {
    constructor(env = process.env.NODE_ENV) {
        this.environment =
            typeof env == 'string' ? env.toLowerCase() : 'development'
        this.silence = this.environment == 'production' ? true : false
        this.talk = false
        this.muteOnce = false
    }

    normalize(...data) {
        return data.map(d => {
            if (typeof d == 'object' && !(d instanceof Error)) {
                try {
                    return JSON.stringify(d)
                } catch (err) {
                    return d.toString()
                }
            } else if (d instanceof Error) {
                return d.message
            } else {
                return d.toString()
            }
        })
    }

    mute(setMute = true) {
        this.silence = setMute
        return this
    }

    output(caller) {
        if (this.muteOnce) {
            this.muteOnce = false
            return this
        }
        if (this.silence && !this.talk) {
            return this
        }
        caller()
        this.talk = false
        return this
    }

    speak() {
        this.talk = true
        return this
    }

    quiet() {
        this.muteOnce = true
        return this
    }

    log(...data) {
        let stringified = this.normalize(...data)
        return this.output(
            console.log.bind(this, chalk.whiteBright(stringified))
        )
    }

    success(...data) {
        let stringified = this.normalize(...data)
        return this.output(
            console.log.bind(this, chalk.greenBright(stringified))
        )
    }

    warn(...data) {
        let stringified = this.normalize(...data)
        return this.output(
            console.warn.bind(this, chalk.yellowBright(stringified))
        )
    }

    error(...data) {
        this.speak()
        let stringified = this.normalize(...data)
        return this.output(
            console.error.bind(this, chalk.redBright(stringified))
        )
    }

    with(caller, ...data) {
        let stringified = this.normalize(...data)
        return this.output(console.log.bind(this, caller(stringified)))
    }
}

export { Notification }
export default new Notification()
