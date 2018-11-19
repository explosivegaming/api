const Express = require('express')
const enableWs = require('express-ws')
require('dotenv').config()
const App = Express()
enableWs(App)

const webModules = {
    "serverInfo": "./server-info/index"
}

const modules = {
    "serverSync": "./server-sync/index"
}

console.log('Loading Web Modules...')
for (let module_name in webModules) {
    console.log(` Starting Module: ${module_name}`)
    App.use('/'+module_name,require(webModules[module_name]))
}

console.log('Loading Other Modules...')
for (let module_name in modules) {
    console.log(` Starting Module: ${module_name}`)
    require(modules[module_name])
}

console.log('Starting Web Server')
App.listen(process.env.HOST_PORT,process.env.HOST_IP,() => {
    console.log(` Listening on: ${process.env.HOST_IP}:${process.env.HOST_PORT}`)
})