const Log = require('../src/Log')

module.exports = (logName) => {
    return new Log(logName,'tail',(data,server) => {
        data = data.replace('${serverName}',server.name)
        try {
            return JSON.parse(data)
        } catch (err) {
            return {
                'failedParse': true,
                'raw': data
            }
        }
    }).router
}