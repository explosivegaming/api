const config = require('../config.json')

class ClientManager {
    constructor(callback) {
        this.clients = {}
        this.serverIDs = {}
        config.servers.forEach((server,index) => {
            this.serverIDs[server.serverID] = index
            this.clients[server.serverID] = []
            try {
                callback(
                    server,
                    (err,data) => sendData(server.serverID,err,data),
                    (status,msg) => closeClients(server.serverID,status,msg)
                )
            } catch (err) {
                delete this.clients[server.serverID]
            }
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
    sendData(serverID,err,data) {
        const clients = this.clients[serverID]
        if (clients) {
            clients.forEach(ws => {
                if (err) ws.close(404,'Server missing file.')
                else if (ws.readyState == 1) ws.send(JSON.stringify(data))
                else if (ws.readyState > 1) this.clientManager.removeClient(serverID,ws)
            })
        }
    }
    closeClients(serverID,status,msg) {
        const clients = this.clients[serverID]
        if (clients) {
            clients.forEach(ws => ws.close(status,msg))
        }
    }
}
module.exports = ClientManager