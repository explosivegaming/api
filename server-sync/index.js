const config = require('./config.json')
const semver = require('semver')
const consoleLog = require('../lib/log')
const Rcon = require('simple-rcon')
const syncVersion = semver.valid(semver.coerce(config.scenarioSyncVersion))

let Version
// The following should be accetped by each version, undefined functions are skiped
// Version.cleanRoles(string) - return array of roles
// Version.generateSetCMD(roles) - using cleaned array of roles to generate a string, overrides deafult in game
// Version.generateAssignCMD(user,byUser,roles) - string to add the roles of a snginle player
// Version.generateUnassignCMD(user,byUser,roles) - string to remove the roles of a snginle player
if (!syncVersion || semver.satisfies(syncVersion,'<3.6.0')) {
    consoleLog('error','sync','Unable to start server sync; sync version is too low')
} else if (semver.satisfies(syncVersion,'3.6.x')) {
    consoleLog('warning','sync','Starting server sync in compatibility mode for version 3.6.0')
    Version = require('./src/3.6.0')
} else if (semver.satisfies(syncVersion,'4.0.x')) {
    Version = require('./src/4.0.0')
}

let sendCMD = (function () {
    let count = 0
    // retry sub-function - will resend command if there is an error upto the max given
    function retry(server, cmd, max, timeout, next) {
        if (count++ > max) {
            consoleLog('error','sync','Failed to send command to: '+server.name)
            return next(new Error('Max retries reached.'))
        } else {
            return setTimeout(function () {
                sendCMD(server, cmd, max, timeout, next)
            }, timeout)
        }
    }
    // sendCMD function - sends the command to the server
    return function (server, cmd, max=10, timeout=50, next=() => {}) {
        if (typeof max == 'function') next=max
        try {
            const client = new Rcon({
                host: process.env[`SERVER_IP_${server.serverID}`],
                port: process.env[`SERVER_RCON_PORT_${server.serverID}`],
                password: process.env[`SERVER_RCON_PWD_${server.serverID}`]
            })
            .exec(cmd, res => {
                if (res.body.startsWith('Unknown command')) {
                    retry(server, cmd, max, timeout, next)
                } else {
                    client.close()
                    consoleLog('success','sync','Send command to: '+server.name)
                    next(null, res)
                }
            })
            .connect()
            .on('error', err => {
                if (err) {
                    consoleLog('error','sync',err)
                    retry(server, cmd, max, timeout, next)
                }
            })
        } catch (err) {
            consoleLog('error','sync',err)
            retry(server, cmd, max, timeout, next)
        }
    }
})()