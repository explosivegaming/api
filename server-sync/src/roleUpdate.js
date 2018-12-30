const sendCMD = require('../src/sendCMD')
const bot = require('../../lib/bot')
const servers = require('../../config').servers.filter(server => server.autoSync)
const semver = require('semver')

const versions = {}
versions['3.6.0'] = require('./3.6.0')
versions['4.0.0'] = require('./4.0.0')


bot.client.on('guildMemberUpdate',async (oldMember,newMember) => {
    // find which user made the change
    const username = newMember.displayName.toLowerCase()
    const auditEntry = await newMember.guild.fetchAuditLogs({type: 'MEMBER_ROLE_UPDATE'}).then(audit => audit.entries.first())
    const byUsername = newMember.guild.members.get(auditEntry.executor.id).displayName.toLowerCase()
    // finding which roles where changed
    const oldRoles = oldMember.roles
    const newRoles = newMember.roles
    const addedRoles = newRoles.filter(role => !oldRoles.has(role.id))
    const removedRoles = oldRoles.filter(role => !newRoles.has(role.id))
    const addedRolesNames = bot.convertRolesToFactorioRoles(addedRoles)
    const removedRolesNames = bot.convertRolesToFactorioRoles(removedRoles)
    // sends update to all server with auto sync enabled
    servers.forEach(server => {
        const rconDetails = {
            name: server.name,
            host: process.env[`SERVER_IP_${server.serverID}`],
            port: process.env[`SERVER_RCON_PORT_${server.serverID}`],
            password: process.env[`SERVER_RCON_PWD_${server.serverID}`],
            version: server.syncVersion
        }
        const version = semver.maxSatisfying(Object.keys(versions),server.syncVersion)
        if (versions[version].generateAssignCMD && addedRolesNames.length > 0) {
            const cmdAdd = versions[version].generateAssignCMD(username,byUsername,addedRolesNames)
            sendCMD(rconDetails,cmdAdd)
        }
        if (versions[version].generateUnassignCMD && removedRolesNames.length > 0) {
            const cmdRemove = versions[version].generateUnassignCMD(username,byUsername,removedRolesNames)
            sendCMD(rconDetails,cmdRemove)
        }
    })
})