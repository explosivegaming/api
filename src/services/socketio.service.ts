import { Service, Inject } from "typedi";
import * as socket_io from 'socket.io';
import { WebServerService } from "./webserver.service";
import { cleanLog } from "../lib/log";
import { getCustomRepository } from "typeorm";
import { ServerDetailsRepository, ServerDetail } from "../entities/server.details.entity";
import { InjectRepository } from "typeorm-typedi-extensions";
import { AccountRepository } from "../entities/user.entity";
import { ApiPermission } from "../entities/key.entity";
import moment = require("moment");
import { DiscordService } from "./discord.service";

@Service()
export class SocketIOService {

    @Inject(type => WebServerService)
    private webServer: WebServerService
    @Inject(type => DiscordService)
    private discordService: DiscordService

    constructor() {
        // because @InjectRepository does not want to work
        this.serverRepo = getCustomRepository(ServerDetailsRepository)
        this.userRepository = getCustomRepository(AccountRepository)
        this.factorioServers = {}
        this.factorioServersCache = {}
    }

    //@InjectRepository()
    private serverRepo: ServerDetailsRepository

    //@InjectRepository()
    private userRepository: AccountRepository

    server: SocketIO.Server
    factorioServers: Object
    factorioServersCache: Object

    init() {
        this.server = socket_io(this.webServer.server,{serveClient: false, path: '/sync/exec'})
        this.server.use(async (socket,next) => {
            return await this.serverMiddleWare(socket,next)
        })
        this.server.on('connection', socket => {
            cleanLog('info',`New web socket connection made: ${socket.id}`)
            socket.on('disconnect', reason => {
                console.log(`Closed a web socket connection: ${socket.id} ${reason}`);
            })
            this.serverOnConnection(socket)
        })
        cleanLog('status','Initialized <socketio.service>')
    }

    async serverMiddleWare(socket: SocketIO.Socket, next: (err?: any) => void) {
        if (!socket.handshake.query.key) return next(new Error('KeyNotFound'))
        const key = socket.handshake.query.key
        const hasPermission = await this.userRepository.keys.keyHasPermission(key,4 | ApiPermission.ExecServers)
        if (!hasPermission) {
            return next(new Error('InvalidPermission'))
        }
        const serverId = socket.handshake.query.serverId
        const server = await this.serverRepo.getByServerId(serverId)
        if (!server) return next(new Error('InvalidServerID'))
        this.factorioServers[socket.id] = server
        next()
    }

    serverOnConnection(socket) {
        socket.on('details',async act => {
            const server = this.factorioServers[socket.id]
            cleanLog('info',`Sending server details to: ${server.identifer}`)
            const now = moment()
            const reset = await this.serverRepo.getResetDate(server.id)
            act(server,now.format('HH:mm'),now.format('YYYY MM DD'),reset)
        })

        socket.on('roles',async act => {
            const server = this.factorioServers[socket.id]
            cleanLog('info',`Sending roles to: ${server.identifer}`)
            const output = []
            const roles = {}
            const discordRoles = await this.discordService.getDiscordRoleSync('displayName')
            const factorioRoles = await this.userRepository.factorioUsers.find({ relations: ['roles'] })
            factorioRoles.forEach(user => {
                roles[user.name] = user.roles.map(role => role.name)
            })
            for (let username in discordRoles) {
                let lUsername = username.toLowerCase()
                if (roles[lUsername]) {
                    discordRoles[username].forEach(role => {
                        if (roles[lUsername].indexOf(role) < 0) {
                            roles[lUsername].push(role)
                        }
                    })
                } else {
                    roles[lUsername] = discordRoles[username]
                }
            }
            for (let username in roles) {
                output.push(`["${username}"]={"${roles[username].join('","')}"}`)
            }
            act(output)
        })

        socket.on('update',data => {
            const server = this.factorioServers[socket.id]
            this.factorioServersCache[server.id][data.type] = data.data
        })
    }

}