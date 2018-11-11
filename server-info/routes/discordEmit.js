const Express = require('express')
const Router = Express.Router()
const config = require('../config.json')
const readLastLines = require('read-last-lines').read
const Tail = require('tail').Tail
const createClients = require('../src/Clients')

Router.get('/',(req,res) => {
    const server = req.server
    let limit = req.query.limit || 10
    if (limit > config.maxReadLength) limit = config.maxReadLength
    const emitsFilePath = server.discordEmit
    readLastLines(emitsFilePath,limit).catch(err => {
        res.status(404).send('Emit File Not Found.')
    }).then(lines => {
        lines = lines.split('\n')
        lines.pop()
        res.status(200).json(lines.map(line => {
            line = line.replace('${serverName}',server.name)
            try {
                return JSON.parse(line)
            } catch (err) {
                return {
                    'failedParse': true,
                    'raw': line
                }
            }
        }))
    }).catch(err => {
        res.status(500)
        console.log(err)
    })
})

const Clients = new createClients((server,clients) => {
    const tail = new Tail(server.discordEmit)
    tail.on('line',data => {
        clients.forEach(ws => {
            if (ws.readyState == 1) ws.send(data.replace('${serverName}',server.name))
            else if (ws.readyState > 1) Clients.removeClient(serverID,ws)
        })
    })
    tail.on('error',err => {
        clients.forEach(ws => ws.close(500))
    })
})

Router.get('/feed',(req,res) => res.status(303).redirect('../'))
Router.ws('/feed',(ws,req) => Clients.addClient(req.server.serverID,ws))

module.exports = Router