const Express = require('express')
const enableWs = require('express-ws')
const consoleLog = require('./lib/log')
require('dotenv').config()
const App = Express()
enableWs(App)

const webModules = {
    "serverInfo": "./server-info/index"
}

const modules = {
    "serverSync": "./server-sync/index"
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

consoleLog('start','init','Starting Web Server')
App.listen(process.env.HOST_PORT,process.env.HOST_IP,() => {
    consoleLog('info','init',` Listening on: ${process.env.HOST_IP}:${process.env.HOST_PORT}`)
})