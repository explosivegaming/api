const Express = require('express')
const Router = Express.Router()
const config = require('../config.json')
const readLastLines = require('read-last-lines').read
const Tail = require('tail').Tail
const createClients = require('../src/Clients')

function createLog(logName) {
    Router.get('/',(req,res) => {
        const server = req.server
        let limit = req.query.limit || 10
        if (limit > config.maxReadLength) limit = config.maxReadLength
        readLastLines(server[logName],limit).catch(err => {
            res.status(404).send('Emit File Not Found.')
        }).then(lines => {
            lines = lines.split('\n')
            lines.pop()
            res.status(200).json(lines)
        }).catch(err => {
            res.status(500)
            console.log(err)
        })
    })

    const Clients = new createClients((server,clients) => {
        const tail = new Tail(server[logName])
        tail.on('line',data => {
            clients.forEach(ws => {
                if (ws.readyState == 1) ws.send(data)
                else if (ws.readyState > 1) Clients.removeClient(serverID,ws)
            })
        })
        tail.on('error',err => {
            clients.forEach(ws => ws.close(500))
        })
    })

    Router.get('/feed',(req,res) => res.status(303).redirect('../'))
    Router.ws('/feed',(ws,req) => Clients.addClient(req.server.serverID,ws))

    return Router
}

module.exports = createLog