const Log = require('../src/Log')

module.exports = logName => {
    return new Log(logName,'watch',data => {
        try {
            return JSON.parse(data)
        } catch (err) {
            return data.toString()
        }
    }).router
}