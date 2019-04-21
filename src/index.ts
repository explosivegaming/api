import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { useContainer as useContainerRouting } from 'routing-controllers';
import { Container } from 'typedi';
import { createConnection, useContainer as useContainerTypeorm } from 'typeorm';
import { log } from './lib/log';
import { WebServerService } from './services/webserver.service';

if (process.env.NODE_ENV !== 'development') process.env.NODE_ENV = 'production';

useContainerTypeorm(Container)
useContainerRouting(Container)
dotenv.config({path:'.env'})

process.on('uncaughtException',error => {
    log('error',`${error.message}:\n\n${error.stack}`)
    process.exit(1)
})

process.on('unhandledRejection',reason => {
    log('warning','There was an unhandled rejection: {reason}',{reason:reason})
})

debugLog('Running in development env')
createConnection().then(() => {
    log('success','Database connection created')
    const webServerService = Container.get(WebServerService)
    webServerService.start()
})
