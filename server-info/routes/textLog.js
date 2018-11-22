const Log = require('../src/Log')

module.exports = logName => {
    return new Log(logName,'tail',data => data).router
}