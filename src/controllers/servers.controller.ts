import { ServerDetailsRepository, ServerDetail as ServerDetails } from "../entities/server.details.entity";
import { Service } from "typedi";
import { JsonController, Get, Authorized, Delete, Post, Body, Put, Param } from "routing-controllers";
import { getCustomRepository } from "typeorm";
import { ApiPermission } from "../entities/key.entity";
import { log } from "../lib/log";

@Service()
@JsonController('/servers')
export class ServerController {

    constructor() {
        // because @InjectRepository does not want to work
        this.serverRepo = getCustomRepository(ServerDetailsRepository)
    }

    //@InjectRepository()
    private serverRepo: ServerDetailsRepository

    @Get('/')
    @Authorized(1 | ApiPermission.ReadServers)
    servers() {
        return this.serverRepo.find()
    }

    @Post('/')
    @Authorized(2 | ApiPermission.WriteServers)
    async addServer(@Body() serverDetails: ServerDetails) {
        await this.serverRepo.insert(serverDetails)
        const details = await this.serverRepo.getByIdentifer(serverDetails.identifer)
        log('Info',`Added server: ${details.id} (${details.identifer})`)
        return details.id
    }

    @Put('/:serverId')
    @Authorized(2 | ApiPermission.WriteServers)
    async updateDetails(@Param('serverId') serverId: string, @Body() serverDetails: ServerDetails) {
        const details = await this.serverRepo.getByServerId(serverId)
        await this.serverRepo.update({ id: details.id },serverDetails)
        debugLog(`Updated server details: ${details.id} (${details.identifer})`)
        return `Updated server details: ${details.id} (${details.identifer})`
    }

    @Get('/:serverId')
    @Authorized(1 | ApiPermission.ReadServers)
    server(@Param('serverId') serverId: string) {
        return this.serverRepo.getByServerId(serverId)
    }

    @Delete('/:serverId')
    @Authorized(2 | ApiPermission.WriteServers)
    async removeServer(@Param('serverId') serverId: string) {
        const details = await this.serverRepo.getByServerId(serverId)
        if (details) {
            await this.serverRepo.delete(details.id)
            log('Info',`Removed server: ${details.id} (${details.identifer})`)
            return `Removed server: ${details.id} (${details.identifer})`
        }
    }

}