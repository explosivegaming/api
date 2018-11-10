const Express = require('express')
const Router = Express.Router()
const fs = require('fs')
const createClients = require('../src/Clients')

Router.get('/',(req,res) => {
    const server = req.server
    const bansFilePath = server.bans
    fs.readFile(bansFilePath,(err,data) => {
        if (err) res.status(404).send('Ban File Not Found.')
        else res.status(200).json(JSON.parse(data))
    })
})

const Clients = new createClients((server,clients) => {
    fs.watch(server.bans).on('change',() => {
        fs.readFile(server.bans,(err,data) => {
            clients.forEach(ws => {
                if (err) ws.close(404,'Info File Not Found.')
                else if (ws.readyState == 1) ws.send(data)
                else Clients.removeClient(serverID,ws)
            })
        })
    })
})

Router.get('/feed',(req,res) => res.status(303).redirect('../'))
Router.ws('/feed',(ws,req) => Clients.addClient(req.server.serverID,ws))

module.exports = Router