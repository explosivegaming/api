const config = require('./config.json')
const semver = require('semver')
const syncVersion = semver.valid(semver.coerce(config.scenarioSyncVersion))

if (!syncVersion || semver.satisfies(syncVersion,'<3.6.0')) {
    console.log('Unable to start server sync; sync version is too low')
} else if (semver.satisfies(syncVersion,'3.6.x')) {
    console.log('Starting server sync in compatibility mode for version 3.6.0')
    require('./src/3.6.0')
} else if (semver.satisfies(syncVersion,'4.0.x')) {
   require('./src/4.0.0')
}