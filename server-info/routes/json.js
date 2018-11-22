const Log = require('../src/Log')

module.exports = logName => {
    return new Log(logName,'json',data => JSON.parse(data)).router
}