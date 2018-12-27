
const Router = require('express').Router
const ClientManager = require('./ClientManager')
const readLastLines = require('read-last-lines').read
const consoleLog = require('../../lib/log')
const config = require('../../config.json')['server-info']
const fs = require('fs')

class Log {
    constructor(name,mode,onData) {
        this.name = name
        this.mode = mode
        this.onData = onData
        this.clientManager = this.createClientManager()
        this.router = Router()

        this.createGet()

        this.router.get('/feed',(req,res) => res.status(303).redirect('.'))
        this.router.ws('/feed',(ws,req) => this.clientManager.addClient(req.server.serverID,ws))
    }

    createGet() {
        this.router.get('/',(req,res) => {
            const server = req.server
    
            let limit = req.query.limit || 10
            if (limit > config.maxReadLength) limit = config.maxReadLength

            switch (this.mode) {
                case 'tail':
                    readLastLines(server.serverDir+config[this.name],limit).catch(err => {
                        res.status(404).send('Server missing file.')
                    }).then(lines => {
                        lines = lines.split('\n')
                        lines.pop()
                        res.status(200).json(lines.map(line => this.onData(line,server)))
                        consoleLog('info','info',`Sent ${this.name} for ${server.serverID} to {ip}`,req)
                    }).catch(err => {
                        res.status(500)
                        consoleLog('error','info',err)
                    })
                    break
                case 'watch':
                    fs.readFile(server.serverDir+config[this.name],(err,data) => {
                        if (err) res.status(404).send('Server missing file.')
                        else {
                            res.status(200).json(this.onData(data,server))
                            consoleLog('info','info',`Sent ${this.name} for ${server.serverID} to {ip}`,req)
                        }
                    })
                    break
                default:
                    consoleLog('error','info','Invalid Log Mode: '+this.mode)
            }
        })
    }

    createClientManager() {
        return new ClientManager((server,sendData,closeClients) => {
            switch (this.mode) {
                case 'tail':
                    this.tail = new Tail(server.serverDir+config[this.name])
                    tail.on('line',data => sendData(undefined,this.onData(data,server)))
                    tail.on('error',err => closeClients(500,'Internal Server Error'))
                    break
                case 'watch':
                    fs.watch(server.serverDir+config[this.name])
                    .on('change',() => {
                        fs.readFile(server.serverDir+config[this.name],(err,data) => sendData(err,this.onData(data,server)))
                    })
                    .on('error',err => closeClients(500,'Internal Server Error'))
                    break
                default:
                    consoleLog('error','info','Invalid Log Mode: '+this.mode)
                    closeClients(500,'Internal Server Error')
            }
        })
    }
}

module.exports = Log