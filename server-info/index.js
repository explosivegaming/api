const router = require('express').Router()
const {isAuthenticated,isAuthenticatedGuest,serverID} = require('../lib/commonRoutes')

router.param('serverID',serverID)

router.get('/:serverID',(req,res) => res.redirect(`${req.server.serverID}/info`))
router.use('/:serverID/info',require('./routes/watch')('info'))
router.use('/:serverID/bans',isAuthenticatedGuest,require('./routes/watch')('bans'))
router.use('/:serverID/console',require('./routes/textLog')('console'))
router.use('/:serverID/roles',isAuthenticated,require('./routes/jsonLog')('roles'))
router.use('/:serverID/discordEmit',isAuthenticated,require('./routes/jsonLog')('discordEmit'))

module.exports = router