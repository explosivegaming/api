
const Router = require('express').Router
const ClientManager = require('./ClientManager')
const readLastLines = require('read-last-lines').read
const config = require('../config.json')
const fs = require('fs')

class Log {
    constructor(name,mode,onUpdate) {
        this.name = name
        this.mode = mode
        this.onUpdate = onUpdate
        this.clientManager = this.createClientManager()
        this.router = Router()

        this.createGet()

        this.router.get('/feed',(req,res) => res.status(303).redirect('../'))
        this.router.ws('/feed',(ws,req) => this.clientManager.addClient(req.server.serverID,ws))
    }

    createGet() {
        this.router.get('/',(req,res) => {
            const server = req.server
    
            let limit = req.query.limit || 10
            if (limit > config.maxReadLength) limit = config.maxReadLength

            switch (this.mode) {
                case 'tail':
                    readLastLines(server[this.name],limit).catch(err => {
                        res.status(404).send('Server missing file.')
                    }).then(lines => {
                        lines = lines.split('\n')
                        lines.pop()
                        res.status(200).json(this.onUpdate(lines,server))
                    }).catch(err => {
                        res.status(500)
                        console.log(err)
                    })
                    break
                case 'json':
                    fs.readFile(server[this.name],(err,data) => {
                        if (err) res.status(404).send('Server missing file.')
                        else res.status(200).json(this.onUpdate(data,server))
                    })
                    break
                default:
                    console.log('Invalid Log Mode: '+this.mode)
            }
        })
    }

    createClientManager() {
        return new ClientManager((server,clients) => {
            switch (this.mode) {
                case 'tail':
                    this.tail = new Tail(server[this.name])
                    tail.on('line',data => {
                        clients.forEach(ws => {
                            if (ws.readyState == 1) ws.send(JSON.stringify(this.onUpdate([data],server)[0]))
                            else if (ws.readyState > 1) this.clientManager.removeClient(serverID,ws)
                        })
                    })
                    tail.on('error',err => {
                        clients.forEach(ws => ws.close(500))
                    })
                    break
                case 'json':
                    fs.watch(server[this.name]).on('change',() => {
                        fs.readFile(server[this.name],(err,data) => {
                            clients.forEach(ws => {
                                if (err) ws.close(404,'Server missing file.')
                                else if (ws.readyState == 1) ws.send(JSON.stringify(this.onUpdate(data,server)))
                                else this.clientManager.removeClient(serverID,ws)
                            })
                        })
                    }).on('error',err => {
                        clients.forEach(ws => ws.close(500))
                    })
                    break
                default:
                    console.log('Invalid Log Mode: '+this.mode)
            }
        })
    }
}

module.exports = Log