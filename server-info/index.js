const Express = require('express')
const config = require('./config.json')
const App = Express()

function isAuthenticated(req,res,next) {
    if (req.query.key == config.apiKey) return next()
    res.status(401).send('Missing or invalid api key.')
}

App.param('serverID',(req,res,next,serverID) => {
    const servers = config.servers
    const server = servers.find(server => server.serverID === serverID)
    if (server) {
        req.server = server
        next()
    } else {
        res.status(400).send('Invalid Server ID.')
    }
})

App.use('/:serverID/info',require('./routes/info'))
App.use('/:serverID/bans',isAuthenticated,require('./routes/bans'))
App.use('/:serverID/discordEmit',isAuthenticated,require('./routes/discordEmit'))

App.listen(config.hostPort,config.hostIP,() => {
    console.log(`Listening on: ${config.hostIP}:${config.hostPort}`)
})