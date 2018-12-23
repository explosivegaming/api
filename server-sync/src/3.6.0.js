module.exports = {
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