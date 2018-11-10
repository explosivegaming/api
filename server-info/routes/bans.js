const Express = require('express')
const Router = Express.Router()
const fs = require('fs')
const config = require('../config.json')

Router.get('/',(req,res) => {
    const server = req.server
    const bansFilePath = server.bans
    fs.readFile(bansFilePath,(err,data) => {
        if (err) res.status(404).send('Info File Not Found.')
        else res.status(200).json(JSON.parse(data))
    })
})

module.exports = Router