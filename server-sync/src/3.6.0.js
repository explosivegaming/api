const moment = require('moment')

module.exports = {
    generateDetails: server => {
        const timedate = moment()
        return `/interface Sync.info{
            server_name='${server.name}',
            server_description='${server.description}',
            time='${timedate.format('HH:mm')}',
            date='${timedate.format('YYYY MM DD')}',
            reset_time='${server.resetAfter == 0 ? 'Non Set' : timedate.add(server.resetAfter,'days').format('YYYY MM DD HH:mm')}',
            branch='master'
        }`
    },
    cleanRoles: roleString => {
        let json = JSON.parse(roleString)
        for (let player in json) json[player] = json[player][0]
        return json
    },
    generateSetCMD: rolesTable => {
        const output = []
        for (let player in rolesTable) {
            const role = typeof rolesTable[player] == 'object' && rolesTable[player][0] || rolesTable[player]
            output.push(`["${player.toLowerCase()}"]="${role}"`)
        }
        return `/interface Sync.set_ranks{${output.join(',')}}`
    }
}