module.exports = {
    cleanRoles: roleString => {
        let json = JSON.parse(roleString)
        for (let player in json) json[player] = json[player][0]
        return json
    },
    generateSetCMD: rolesTable => {
        const output = []
        for (let player in rolesTable) {
            output.push(`["${player.toLowerCase()}"]="${rolesTable[player]}"`)
        }
        return `/interface Sync.set_ranks{${output.join(',')}}`
    }
}