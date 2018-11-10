const config = require('../config.json')

class Clients {
    constructor(callback) {
        this.clients = {}
        config.servers.forEach(server => {
            this.clients[server.serverID] = []
            callback(server,this.clients[server.serverID])
        })
    }
    addClient(serverID,ws) {
        const clients = this.clients[serverID]
        if (clients) {
            clients.push(ws)
            ws.on('close',() => this.removeClient(serverID,ws))
        }
        else ws.close(404,'Server missing file.')
    }
    removeClient(serverID,ws) {
        const clients = this.clients[serverID]
        if (clients) {
            if (clients.indexOf(ws) >= 0) clients.splice(clients.indexOf(ws),1) 
        }
    }
}
module.exports = Clients