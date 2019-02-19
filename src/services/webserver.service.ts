import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as path from 'path';
import * as express_session from 'express-session';
import * as connect_redis from 'connect-redis';
import { Action, useExpressServer, CurrentUser } from 'routing-controllers';
import { Inject, Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { AccountRepository, AccountRepositoryRelations } from '../entities/user.entity';
import { ApiPermission } from '../entities/key.entity';
import { cleanLog, errorLog } from '../lib/log';
import { DiscordService } from './discord.service';
import { RedisService } from './redis.service';
import { SocketIOService } from './socketio.service';
import { getCustomRepository } from 'typeorm';

const RedisStore = connect_redis(express_session)

@Service()
export class WebServerService {

    @Inject(type => DiscordService)
    private discordService: DiscordService
    @Inject(type => RedisService)
    private redisService: RedisService
    @Inject(type => SocketIOService)
    private socketService: SocketIOService

    constructor() {
        // because @InjectRepository does not want to work
        this.userRepository = getCustomRepository(AccountRepository)
    }

    //@InjectRepository()
    private userRepository: AccountRepository

    server: http.Server
    app: express.Application
    store: express.RequestHandler

    private init() {
        this.app = express()
        this.server = http.createServer(this.app)
        cleanLog('status','Initialized <app.webserver.service>')
    }

    private initMiddleware() {
        this.app.enable('trust proxy');
        this.app.set('trust proxy', 'loopback');
        this.app.disable('x-powered-by');
        this.store = express_session({
            store: new RedisStore({ client: this.redisService.client as any, ttl: 7 * 24 * 60 * 60 }),
            secret: process.env.SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: { secure: false }
        })
        this.app.use(this.store)
        this.app.use(bodyParser.urlencoded({ extended: true }));
        this.app.use(bodyParser.json());
        this.app.use(express.static(path.join(__dirname, '../../public')));
        cleanLog('status','Initialized <middleware.webserver.service>')
    }

    private initControllers() {
        useExpressServer(this.app, {
            authorizationChecker: async (action: Action, roles: Array<ApiPermission>) => {
                let key: string = action.request.headers['authorization'] || action.request.query.key || action.request.body.key
                if (key) {
                    key = key.replace('Bearer ','')
                    return this.userRepository.keys.keyHasPermission(key,roles)
                } else {
                    let user = action.request.session.user
                    if (!user) return false
                    user = await this.userRepository.findOne(user)
                    if (!user) return false
                    return this.userRepository.keys.accountHasPermission(user,roles)
                }
            },
            currentUserChecker: (action) => {
                if (action.request.session.user) {
                    return this.userRepository.findOne(action.request.session.user,{ relations: AccountRepositoryRelations })
                }
            },
            defaultErrorHandler: false,
            development: process.env.NODE_ENV === 'development',
            controllers: [__dirname + '/../controllers/*.controller{.js,.ts}']
        })
        cleanLog('status','Initialized <controllers.webserver.service>')
    }

    start() {
        this.init()
        this.initMiddleware()
        this.initControllers()
        this.discordService.init()
        this.socketService.init()
        const port = process.env.API_PORT
        return this.server.listen(port, err => {
            if (err) errorLog(err)
            cleanLog('start','Started Web Server on port '+port)
        })
    }
}