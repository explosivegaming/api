const bot = require('../../lib/bot')

module.exports = function(req,res) {
    const roles = bot.getRoles('display')
    const users = bot.getUserRoles('display')
    const factorio = bot.getUserRoles('display',true)
    res.json({roles:roles,users:users,factorio:factorio})
}