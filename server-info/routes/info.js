const Express = require('express')
const Router = Express.Router()
const fs = require('fs')

Router.get('/',(req,res) => {
    const server = req.server
    const infoFilePath = server.info
    fs.readFile(infoFilePath,(err,data) => {
        if (err) res.status(404).send('Info File Not Found.')
        else res.status(200).json(JSON.parse(data))
    })
})

module.exports = Router