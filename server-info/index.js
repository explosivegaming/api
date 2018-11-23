const config = require('./config.json')
const router = require('express').Router()

function isAuthenticated(req,res,next) {
    if (req.query.key == process.env.API_KEY) return next()
    res.status(401).send('Missing or invalid api key.')
}

router.param('serverID',(req,res,next,serverID) => {
    const servers = config.servers
    const server = servers.find(server => server.serverID === serverID)
    if (server) {
        req.server = server
        next()
    } else {
        res.status(400).send('Invalid Server ID.')
    }
})

router.get('/:serverID',(req,res) => res.redirect(`${req.server.serverID}/info`))
router.use('/:serverID/info',require('./routes/watch')('info'))
router.use('/:serverID/bans',isAuthenticated,require('./routes/watch')('bans'))
router.use('/:serverID/console',require('./routes/textLog')('console'))
router.use('/:serverID/roles',isAuthenticated,require('./routes/jsonLog')('roles'))
router.use('/:serverID/discordEmit',isAuthenticated,require('./routes/jsonLog')('discordEmit'))

module.exports = router