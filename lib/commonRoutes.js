const config = require('../config')
const consoleLog = require('./log')

function serverID(req,res,next,serverID) {
    const servers = config.servers
    const server = servers.find(server => server.serverID === serverID)
    if (server) {
        if (!server.hasApi) res.status(403).send('Server has api disabled.')
        else {
            if (server.localMachine) {
                req.server = server
                next()
            } else {
                const redirect = process.env[`SERVER_API_URL_${server.serverID}`]+req.originalUrl
                consoleLog('info','redirect',`Redirected <{ip}> to: ${redirect}`,req)
                res.redirect(redirect)
            }
        }
    } if (process.env['DEFAULT_ROUTE_API_URL']) {
        const redirect = process.env['DEFAULT_ROUTE_API_URL']+req.originalUrl
        consoleLog('info','redirect',`Redirected <{ip}> to: ${redirect}`,req)
        res.redirect(redirect)
    } else {
        res.status(400).send('Invalid Server ID.')
    }
}

function isAuthenticated(req,res,next) {
    if (req.query.key == process.env.API_KEY) return next()
    res.status(401).send('Missing or invalid api key.')
    consoleLog('warning','auth',`Invalid key ${req.query.key} from <{ip}>`,req)
}

module.exports = {
    serverID: serverID,
    isAuthenticated: isAuthenticated
}