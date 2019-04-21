import { Service, Inject } from "typedi";
import { JsonController, Get, Authorized, Delete, Post, Body, Put, Param, QueryParam } from "routing-controllers";
import { getCustomRepository } from "typeorm";
import { ApiPermission } from "../entities/key.entity";
import { log } from "../lib/log";
import { FactorioRoleRepository } from "../entities/role.factorio.entity";
import { DiscordService } from "../services/discord.service";

@Service()
@JsonController('/roles')
export class ServerController {

    constructor() {
        // because @InjectRepository does not want to work
        this.rolesRepo = getCustomRepository(FactorioRoleRepository)
    }

    //@InjectRepository()
    private rolesRepo: FactorioRoleRepository

    @Inject(type => DiscordService)
    private discordService: DiscordService

    @Get('/')
    @Authorized(1 | ApiPermission.ReadRoles)
    roles(@QueryParam('role') roleName: string) {
        if (roleName) {
            debugLog(`Send one role: <${roleName}>`)
            return this.rolesRepo.getByName(roleName)
        } else {
            debugLog('Send all roles')
            return this.rolesRepo.find()
        }
    }

    @Delete('/:roleName')
    @Authorized(2 | ApiPermission.WriteRoles)
    async delete(@Param('roleName') roleName: string) {
        await this.rolesRepo.delete({ name: roleName })
        debugLog(`Removed role: ${roleName}`)
        return `Removed role: ${roleName}`
    }

    @Get('/link')
    @Authorized(2 | ApiPermission.WriteRoles)
    link(@QueryParam('factorio') factorioRoleName: string, @QueryParam('discord') discordRoleId: string) {
        return this.rolesRepo.linkToDiscord(factorioRoleName,discordRoleId)
    }

    @Get('/unlink')
    @Authorized(2 | ApiPermission.WriteRoles)
    unlink(@QueryParam('factorio') factorioRoleName: string, @QueryParam('discord') discordRoleId: string) {
        return this.rolesRepo.unlinkFromDiscord(factorioRoleName,discordRoleId)
    }

    @Get('/discord')
    @Authorized(1 | ApiPermission.ReadRoles)
    discord(@QueryParam('userAs') userKey: string,@QueryParam('roleAs') roleKey: string,@QueryParam('keyByUser') invert: boolean,@QueryParam('asFactorio') asFactorio: boolean) {
        if (asFactorio) {
            const userRoles = this.discordService.getDiscordRoleSync(userKey)
            if (invert) {
                return userRoles
            } else {
                // inverts the list as it is inverted by default with
                return new Promise(resolve => {
                    userRoles.then(users => {
                        const roles = {}
                        for (let user in users) {
                            users[user].forEach(role => {
                                if (!roles[role]) roles[role] = []
                                if (!roles[role].includes(user)) roles[role].push(user)
                            })
                        }
                        resolve(roles)
                    })
                })
            }
        } else {
            if (invert) {
                return this.discordService.getUserRoles(roleKey,userKey)
            } else {
                return this.discordService.getRoles(roleKey,userKey)
            }
        }
    }

}