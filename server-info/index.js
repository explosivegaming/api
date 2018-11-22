const config = require('./config.json')
const app = require('express')()

function isAuthenticated(req,res,next) {
    if (req.query.key == process.env.API_KEY) return next()
    res.status(401).send('Missing or invalid api key.')
}

app.param('serverID',(req,res,next,serverID) => {
    const servers = config.servers
    const server = servers.find(server => server.serverID === serverID)
    if (server) {
        req.server = server
        next()
    } else {
        res.status(400).send('Invalid Server ID.')
    }
})

app.get('/:serverID',(req,res) => res.redirect(`/${req.server.serverID}/info`))
app.use('/:serverID/info',require('./routes/json')('info'))
app.use('/:serverID/bans',isAuthenticated,require('./routes/json')('bans'))
app.use('/:serverID/console',require('./routes/textLog')('console'))
app.use('/:serverID/roles',isAuthenticated,require('./routes/jsonLog')('roles'))
app.use('/:serverID/discordEmit',isAuthenticated,require('./routes/jsonLog')('discordEmit'))

module.exports = app