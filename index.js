const modules = {
    "Server Info": "./server-info/index"
}

for (let module_name in modules) {
    console.log(`Starting Modules: ${module_name}`)
    require(modules[module_name])
}