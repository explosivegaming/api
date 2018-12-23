const sendCMD = require('../src/sendCMD')
const bot = require('../../lib/bot')
const semver = require('semver')

// The following should be accetped by each versions, undefined functions are skiped
// version.cleanRoles(string) - return array of roles
// version.generateSetCMD(roles) - using cleaned array of roles to generate a string, overrides deafult in game
// version.generateAssignCMD(user,byUser,roles) - string to add the roles of a snginle player
// version.generateUnassignCMD(user,byUser,roles) - string to remove the roles of a snginle player
const versions = {}
versions['3.6.0'] = require('../src/3.6.0')
versions['4.0.0'] = require('../src/4.0.0')

module.exports = async function(req,res) {
    const rconDetails = req.rcon
    await bot.ready()
    const users = bot.getUserRoles('display',true)
    const version = semver.maxSatisfying(Object.keys(versions),rconDetails.version)
    sendCMD(rconDetails,versions[version].generateSetCMD(users))
    res.send(versions[version].generateSetCMD(users))
}