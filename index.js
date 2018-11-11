const Express = require('express')
const enableWs = require('express-ws')
const config = require('./config.json')
const App = Express()
enableWs(App)

const modules = {
    "serverInfo": "./server-info/index"
}

for (let module_name in modules) {
    console.log(`Starting Modules: ${module_name}`)
    App.use('/'+module_name,require(modules[module_name]))
}

App.listen(config.hostPort,config.hostIP,() => {
    console.log(`Listening on: ${config.hostIP}:${config.hostPort}`)
})