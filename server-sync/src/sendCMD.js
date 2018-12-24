const consoleLog = require('../../lib/log')
const Rcon = require('simple-rcon')

const sendCMD = (function () {
    let count = 0
    // retry sub-function - will resend command if there is an error upto the max given
    function retry(rconDetails, cmd, max, timeout, next) {
        if (count++ > max) {
            consoleLog('error','sync','Failed to send command to: '+rconDetails.name)
            return next(new Error('Max retries reached.'))
        } else {
            return setTimeout(function () {
                sendCMD(rconDetails, cmd, max, timeout, next)
            }, timeout)
        }
    }
    // sendCMD function - sends the command to the rconDetails
    return function (rconDetails, cmd, max=10, timeout=50, next=() => {}) {
        if (typeof max == 'function') next=max
        try {
            const client = new Rcon({
                host: rconDetails.host,
                port: rconDetails.port,
                password: rconDetails.password
            })
            .exec(cmd, res => {
                if (res.body.startsWith('Unknown command')) {
                    retry(rconDetails, cmd, max, timeout, next)
                } else {
                    client.close()
                    consoleLog('success','sync','Send command to: '+rconDetails.name)
                    next(null, res)
                }
            })
            .connect()
            .on('error', err => {
                if (err) {
                    consoleLog('error','sync',err)
                    retry(rconDetails, cmd, max, timeout, next)
                }
            })
        } catch (err) {
            consoleLog('error','sync',err)
            retry(rconDetails, cmd, max, timeout, next)
        }
        return cmd
    }
})()

module.exports = sendCMD