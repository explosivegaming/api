import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { useContainer as useContainerRouting } from 'routing-controllers';
import { Container } from 'typedi';
import { createConnection, useContainer as useContainerTypeorm } from 'typeorm';
import { cleanLog } from './lib/log';
import { WebServerService } from './services/webserver.service';

if (process.env.NODE_ENV !== 'development') process.env.NODE_ENV = 'production';

useContainerTypeorm(Container)
useContainerRouting(Container)
dotenv.config({path:'.env'})

process.on('uncaughtException',error => {
    cleanLog('error',`${error.message}:\n\n${error.stack}`)
    process.exit(1)
})

process.on('unhandledRejection',reason => {
    cleanLog('warning','There was an unhandled rejection: {reason}',{reason:reason})
})

cleanLog('debug','Running in development env')
createConnection().then(() => {
    cleanLog('success','Database connection created')
    const webServerService = Container.get(WebServerService)
    webServerService.start()
})
