const sendCMD = require('../src/sendCMD')
const bot = require('../../lib/bot')
const semver = require('semver')

const versions = {}
versions['3.6.0'] = require('../src/3.6.0')
versions['4.0.0'] = require('../src/4.0.0')

module.exports = {
    get: function(req,res) {
        const roles = bot.getRoles('display')
        const users = bot.getUserRoles('display')
        const factorio = bot.getUserRoles('display',true)
        res.json({roles:roles,users:users,factorio:factorio})
        consoleLog('info','sync',`Sent roles to {ip}`,req)
    },
    post: function(req,res,next) {
        const rconDetails = req.rcon
        const users = bot.getUserRoles('display',true)
        const version = semver.maxSatisfying(Object.keys(versions),rconDetails.version)
        const cmd = versions[version].generateSetCMD(users)
        sendCMD(rconDetails,cmd)
        if (!req.cmd) req.cmd=''
        req.cmd+='roles: '+cmd+'\n'
        next()
    }
}