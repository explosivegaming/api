const router = require('express').Router()
const {isAuthenticated,serverID} = require('../lib/commonRoutes')
require('./src/roleUpdate')

router.param('serverID',serverID)

function generateRconDetails(req,res,next) {
    if (req.server) {
        const server = req.server
        req.rcon = {
            name: server.name,
            host: process.env[`SERVER_IP_${server.serverID}`],
            port: process.env[`SERVER_RCON_PORT_${server.serverID}`],
            password: process.env[`SERVER_RCON_PWD_${server.serverID}`],
            version: server.syncVersion
        }
        if (req.rcon.version != '0') next()
        else res.status(403).send('Server does not have valid sync version')
    } else {
        req.rcon = {
            name: req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip,
            host: req.body.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip,
            port: req.body.port || undefined,
            password: req.body.password || undefined,
            version: req.body.version || '3.6.0'
        }
        if (!req.rcon.port || !req.rcon.password) res.status(400).send('Error: rcon port (ip) or passworrd (password) was not specifed')
        else {
            if (req.rcon.version != '0') next()
            else res.status(403).send('Server does not have valid sync version')
        }
    }
}

function finalise(req,res) {
    res.send(req.cmd)
}

const routes = {
    roles: require('./routes/roles'),
    details: require('./routes/details')
}

router.get('/roles',isAuthenticated,routes.roles.get)
router.get('/details',isAuthenticated,routes.details.get)
router.post('/roles',generateRconDetails,routes.roles.post,finalise)
router.post('/details',generateRconDetails,routes.details.post,finalise)
router.post('/all',generateRconDetails,routes.roles.post,routes.details.post,finalise)
// these get requests act as predefined posts
router.get('/:serverID/roles',isAuthenticated,generateRconDetails,routes.roles.post,finalise)
router.get('/:serverID/details',isAuthenticated,generateRconDetails,routes.details.post,finalise)
router.get('/:serverID/all',isAuthenticated,generateRconDetails,routes.roles.post,routes.details.post,finalise)

module.exports = router

// test functions
//sendCMD(config.servers[0],'<cooldude2606> ping')
//sendCMD(config.servers[0],'/interface game.print("PONG")')
//sendCMD(config.servers[0],versions.generateSetCMD(require(config.defaultRoleJson)))
//sendCMD(config.servers[0],versions.generateAssignCMD('Sakama','Cooldude2606',["Donator", "Member", "Mod"]))