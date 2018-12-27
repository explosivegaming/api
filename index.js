const Express = require('express')
const enableWs = require('express-ws')
const consoleLog = require('./lib/log')
const bot = require('./lib/bot')
require('dotenv').config()
const config = require('./config')
const App = Express()
enableWs(App)

config.servers.filter(server => server.localMachine).forEach(server => {
    const env = process.env
    env[`SERVER_IP_${server.serverID}`]=env.HOST_IP
    env[`SERVER_API_URL_${server.serverID}`]=`http://${env.HOST_IP}:${env.HOST_PORT}`
    env[`SERVER_API_KEY_${server.serverID}`]=env.API_KEY
})

const webModules = {
    "serverInfo": "./server-info/index",
    "serverSync": "./server-sync/index"
}

const modules = {
    
}

consoleLog('status','init','Loading Web Modules...')
for (let module_name in webModules) {
    consoleLog('info','init',`Starting Module: ${module_name}`)
    App.use('/'+module_name,require(webModules[module_name]))
}

consoleLog('status','init','Loading Other Modules...')
for (let module_name in modules) {
    consoleLog('info','init',`Starting Module: ${module_name}`)
    require(modules[module_name])
}

consoleLog('start','init','Starting Discord Bot')
bot.ready().then(() => {
    consoleLog('start','init','Starting Web Server')
    App.listen(process.env.HOST_PORT,process.env.HOST_IP,() => {
        consoleLog('info','init',` Listening on: ${process.env.HOST_IP}:${process.env.HOST_PORT}`)
    })
})