const sendCMD = require('../src/sendCMD')
const semver = require('semver')
const config = require('../../config')

const versions = {}
versions['3.6.0'] = require('../src/3.6.0')
versions['4.0.0'] = require('../src/4.0.0')

module.exports = {
    get: function(req,res) {
        const servers = {}
        config.servers.forEach(server => {
            servers[server.serverID] = server
        })
        res.json(servers)
        consoleLog('info','sync',`Sent details to {ip}`,req)
    },
    post: async function(req,res,next) {
        const rconDetails = req.rcon
        const version = semver.maxSatisfying(Object.keys(versions),rconDetails.version)
        const cmd = versions[version].generateDetails(req.server)
        sendCMD(rconDetails,cmd)
        if (!req.cmd) req.cmd=''
        req.cmd+='details: '+cmd+'\n'
        next()
    }
}