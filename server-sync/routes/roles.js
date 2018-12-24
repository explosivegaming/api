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
    },
    post: async function(req,res,next) {
        const rconDetails = req.rcon
        await bot.ready()
        const users = bot.getUserRoles('display',true)
        const version = semver.maxSatisfying(Object.keys(versions),rconDetails.version)
        const cmd = versions[version].generateSetCMD(users)
        sendCMD(rconDetails,cmd)
        if (!req.cmd) req.cmd=''
        req.cmd+='roles: '+cmd+'\n'
        next()
    }
}