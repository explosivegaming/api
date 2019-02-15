import { ServerDetailsRepository, ServerDetail as ServerDetails } from "../entities/server.details.entity";
import { Service, Inject } from "typedi";
import { JsonController, Get, Authorized, Delete, Post, Put, Param, Body, BodyParam, HttpError } from "routing-controllers";
import { getCustomRepository } from "typeorm";
import { ApiPermission } from "../entities/key.entity";
import { cleanLog } from "../lib/log";
import { AccountRepository } from "../entities/user.entity";
import { rconDetails, send } from "../lib/rcon-command";
import moment = require("moment");
import { DiscordService } from "../services/discord.service";

@Service()
@JsonController('/sync')
export class SyncController {

    constructor() {
        // because @InjectRepository does not want to work
        this.serverRepo = getCustomRepository(ServerDetailsRepository)
        this.accountRepo = getCustomRepository(AccountRepository)
    }

    //@InjectRepository()
    private serverRepo: ServerDetailsRepository

    private accountRepo: AccountRepository
    
    @Inject(type => DiscordService)
    private discordService: DiscordService
    
    @Post('/details')
    @Authorized(4 | ApiPermission.ExecServers)
    async details(@BodyParam('rcon') rconDetails: rconDetails, @BodyParam('serverId') serverId: string) {
        const serverDetails = await this.serverRepo.getByServerId(serverId)
        if (!serverDetails) {
            return new HttpError(404,'Server id not found')
        }
        cleanLog('info',`Sending details command to: ${rconDetails.host}:${rconDetails.port}`)
        const now = moment()
        return send(rconDetails,`interface Sync.info{
            server_name='${serverDetails.name}',
            server_description='${serverDetails.description}',
            time='${now.format('HH:mm')}',
            date='${now.format('YYYY MM DD')}',
            reset_time='${await this.serverRepo.getResetDate(serverId)}',
            branch='master'
        } return "200 - Details Synced"`)
    }

    @Post('/roles')
    @Authorized(4 | ApiPermission.ExecServers)
    async roles(@BodyParam('rcon') rconDetails: rconDetails) {
        cleanLog('info',`Sending roles command to: ${rconDetails.host}:${rconDetails.port}`)
        const output = []
        const roles = {}
        const discordRoles = await this.discordService.getDiscordRoleSync('displayName')
        const factorioRoles = await this.accountRepo.factorioUsers.find({ relations: ['roles'] })
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
        return send(rconDetails,`/interface Sync.set_roles{${output.join(',')}} return '200 - Roles Synced'`)
    }

    @Post('/role-assign')
    @Authorized(4 | ApiPermission.ExecServers)
    async assignRole(@BodyParam('rcon') rconDetails: rconDetails,@BodyParam('username') username: string,@BodyParam('byUser') byUser: string,@BodyParam('roles') roles: Array<string>) {

    }

    @Post('/role-unassign')
    @Authorized(4 | ApiPermission.ExecServers)
    async unassignRole(@BodyParam('rcon') rconDetails: rconDetails,@BodyParam('username') username: string,@BodyParam('byUser') byUser: string,@BodyParam('roles') roles: Array<string>) {
        
    }

    @Post('/ping')
    @Authorized(4 | ApiPermission.ExecServers)
    ping(@BodyParam('rcon') rconDetails: rconDetails) {
        cleanLog('ping',`Sending ping to: ${rconDetails.host}:${rconDetails.port}`)
        return send(rconDetails,`<${moment().format('YYYY-MM-DD HH:mm:ss')}> Ping! (Please tell Cooldude2606 in discord)`)
    }

    @Post('/pong')
    @Authorized(4 | ApiPermission.ExecServers)
    pong(@BodyParam('rcon') rconDetails: rconDetails) {
        cleanLog('ping',`Sending pong to: ${rconDetails.host}:${rconDetails.port}`)
        return send(rconDetails,`/interface local msg = "<${moment().format('YYYY-MM-DD HH:mm:ss')}> Pong! (Please tell Cooldude2606 in discord)" game.print(msg) return msg`)
    }

}