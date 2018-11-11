const Express = require('express')
const enableWs = require('express-ws')
const config = require('./config.json')
const App = Express()
enableWs(App)

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

App.get('/:serverID',(req,res) => res.redirect(`/${req.server.serverID}/info`))
App.use('/:serverID/info',require('./routes/json')('info'))
App.use('/:serverID/bans',isAuthenticated,require('./routes/json')('bans'))
App.use('/:serverID/console',require('./routes/textLog')('console'))
App.use('/:serverID/roles',isAuthenticated,require('./routes/jsonLog')('roles'))
App.use('/:serverID/discordEmit',isAuthenticated,require('./routes/jsonLog')('discordEmit'))

App.listen(config.hostPort,config.hostIP,() => {
    console.log(`Listening on: ${config.hostIP}:${config.hostPort}`)
})