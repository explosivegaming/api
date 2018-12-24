const moment = require('moment')

module.exports = {
    generateDetails: server => {
        const timedate = moment()
        return `/interface Sync.info{
            server_name='${server.name}',
            server_description='${server.description}',
            time='${timedate.format('HH:mm')}',
            date='${timedate.format('YYYY MM DD')}',
            reset_time='${timedate.add(server.resetAfter,'days').format('YYYY MM DD HH:mm')}',
            branch='master'
        }`
    },
    cleanRoles: roleString => {
        let json = JSON.parse(roleString)
        for (let player in json) {
            if (typeof json[player] == 'string') json[player] = [json[player]]
        }
        return json
    },
    generateSetCMD: rolesTable => {
        const output = []
        for (let player in rolesTable) {
            output.push(`["${player.toLowerCase()}"]={"${rolesTable[player].join('","')}"}`)
        }
        return `/interface Sync.set_roles{${output.join(',')}}`
    },
    generateAssignCMD: (user,byUser,roles) => {
        let roleOutput
        if (typeof roles == 'string') roleOutput = `{"${roles}"}`
        roleOutput = `{"${roles.join('","')}"}`
        return `/interface Sync.assign_role("${user.toLowerCase()}",${roleOutput},"${byUser ? byUser.toLowerCase() : 'nil'}")`
    },
    generateUnassignCMD: (user,byUser,roles) => {
        let roleOutput
        if (typeof roles == 'string') roleOutput = `{"${roles}"}`
        roleOutput = `{"${roles.join('","')}"}`
        return `/interface Sync.unassign_role("${user.toLowerCase()}",${roleOutput},"${byUser ? byUser.toLowerCase() : 'nil'}")`
    }
}