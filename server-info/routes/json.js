const Express = require('express')
const Router = Express.Router()
const fs = require('fs')
const createClients = require('../src/Clients')

function createLog(logName) {
    Router.get('/',(req,res) => {
        const server = req.server
        fs.readFile(server[logName],(err,data) => {
            if (err) res.status(404).send('Server missing file.')
            else res.status(200).json(JSON.parse(data))
        })
    })

    const Clients = new createClients((server,clients) => {
        fs.watch(server[logName]).on('change',() => {
            fs.readFile(server[logName],(err,data) => {
                clients.forEach(ws => {
                    if (err) ws.close(404,'Server missing file.')
                    else if (ws.readyState == 1) ws.send(data)
                    else Clients.removeClient(serverID,ws)
                })
            })
        }).on('error',err => {
            clients.forEach(ws => ws.close(500))
        })
    })

    Router.get('/feed',(req,res) => res.status(303).redirect('../'))
    Router.ws('/feed',(ws,req) => Clients.addClient(req.server.serverID,ws))

    return Router
}

module.exports = createLog