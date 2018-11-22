const Chalk = require('chalk')
const moment = require('moment')

function logType(type) {
    const output = '['+type.charAt(0).toUpperCase()+type.toLowerCase().slice(1)+']'
    switch (type.toLowerCase()) {
        case 'info':
            return Chalk.cyan(output);
        case 'start':
        case 'success':
            return Chalk.green(output);
        case 'stop':
        case 'error':
            return Chalk.red(output);
        case 'status':
            return Chalk.magenta(output);
        case 'warning':
            return Chalk.yellow(output);
        default:
            return output;
    }
}

module.exports = function(type,module_name,message) {
    console.log(Chalk`{grey ${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')} <${module_name.toLowerCase()}>} ${logType(type)} ${message}`)
}