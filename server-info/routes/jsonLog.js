const Log = require('../src/Log')

module.exports = (logName) => {
    return new Log(logName,'tail',(data,server) => {
        return data.map(line => {
            line = line.replace('${serverName}',server.name)
            try {
                return JSON.parse(line)
            } catch (err) {
                return {
                    'failedParse': true,
                    'raw': line
                }
            }
        })
    }).router
}