const consoleLog = require('./log')
const Discord = require('discord.js')
const bot = new Discord.Client()
const config = require('../config').discord
const roleConversion = require('../config').roles

let ready = false
function login() {
    if (ready) return true
    return new Promise((resolve,reject) => {
        if (config.numberOfGuilds == 0) {
            consoleLog('info','bot','Bot Skiped due to no guilds')
            resolve(true)
            return
        }
        bot.on('ready',() => {
            ready=true
            consoleLog('info','bot','Bot Ready')
            resolve(true)
        })
        bot.login(process.env.BOT_TOKEN)
    }).catch(err => consoleLog('error','bot',err))
}

function getGuilds() {
    if (!ready) throw new Error('Bot not ready or disabled')
    const guilds = []
    for (let i=0;i<config.numberOfGuilds;i++) {
        guilds.push(bot.guilds.get(process.env['GUILD_ID_'+(i+1)]))
    }
    return guilds
}

// returnType can be undefined (role id in each guild is listed), display (user display names are listed in each role), id (user ids are listed in each role)
function getRoles(returnType) {
    if (!ready) throw new Error('Bot not ready or disabled')
    const roles = {}
    const guilds = getGuilds()
    guilds.forEach(guild => {
        guild.roles.forEach(role => {
            switch (returnType) {
                case undefined: {
                    if (!roles[role.name]) roles[role.name] = {}
                    roles[role.name][guild.id] = role.id
                } break
                case 'display': {
                    if (!roles[role.name]) roles[role.name] = []
                    role.members.forEach(member => {
                        const username = member.displayName.toLowerCase()
                        if (!roles[role.name].includes(username)) roles[role.name].push(username)
                    })
                } break
                case 'id': {
                    if (!roles[role.name]) roles[role.name] = []
                    role.members.forEach(member => {
                        if (!roles[role.name].includes(member.id)) roles[role.name].push(member.id)
                    })
                } break
            }
        })
    })
    return roles
}

function getUserRoles(returnType='display',convert=false) {
    if (!ready) throw new Error('Bot not ready or disabled')
    let roles = getRoles(returnType)
    if (convert) roles = convertUsersToFactorioRoles(roles)
    const users = {}
    for (roleName in roles) {
        roles[roleName].forEach(user => {
            if (!users[user]) users[user] = []
            if (!users[user].includes(roleName)) users[user].push(roleName)
        })
    }
    return users
}

function convertUsersToFactorioRoles(roles) {
    const newRoles = {}
    for (discordRole in roleConversion) {
        const factorioRole = roleConversion[discordRole]
        if (!newRoles[factorioRole]) newRoles[factorioRole]=roles[discordRole]
        else newRoles[factorioRole]=newRoles[factorioRole].concat(roles[discordRole])
    }
    return newRoles
}

function convertRolesToFactorioRoles(roles) {
    return roles.map(role => roleConversion[role.name])
}

module.exports = {
    client: bot,
    ready: login,
    getGuilds: getGuilds,
    getRoles: getRoles,
    getUserRoles: getUserRoles,
    convertUsersToFactorioRoles: convertUsersToFactorioRoles,
    convertRolesToFactorioRoles: convertRolesToFactorioRoles
}