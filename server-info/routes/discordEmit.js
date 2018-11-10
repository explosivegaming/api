const Express = require('express')
const Router = Express.Router()
const config = require('../config.json')
const readLastLines = require('read-last-lines').read

Router.get('/',(req,res) => {
    const server = req.server
    let limit = req.query.limit || 10
    if (limit > config.maxReadLength) limit = config.maxReadLength
    const emitsFilePath = server.discordEmit
    readLastLines(emitsFilePath,limit).catch(err => {
        res.status(404).send('Info File Not Found.')
    }).then(lines => {
        lines = lines.split('\n')
        lines.pop()
        res.status(200).json(lines)
    })
})

module.exports = Router