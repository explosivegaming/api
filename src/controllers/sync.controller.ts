import { Service, Inject } from "typedi";
import { JsonController, Get, Authorized, Delete, Post, Put, Param, Body, BodyParam, HttpError, QueryParam } from "routing-controllers";
import { ApiPermission } from "../entities/key.entity";
import { log } from "../lib/log";
import { SocketIOService } from "../services/socketio.service";

@Service()
@JsonController('/sync')
export class SyncController {

    @Inject(type => SocketIOService)
    private socketService: SocketIOService

    @Post('/action')
    @Authorized(4 | ApiPermission.ExecServers)
    generic(@Body() body) {
        this.socketService.server.emit('action',body)
        return 'Send Command'
    }

    @Post('/rawCmd')
    @Authorized(4 | ApiPermission.ExecServers)
    rawCmd(@BodyParam('cmd') cmd: string) {
        log('info',`Send Command: ${cmd}`)
        this.socketService.server.emit('action',{type: 'rawCmd', cmd: cmd})
        return `Send Command`
    }

    @Post('/roleAssign')
    @Authorized(4 | ApiPermission.ExecServers)
    assignRole(@BodyParam('username') username: string,@BodyParam('byUser') byUser: string,@BodyParam('roles') roles: Array<string>) {
        log('info',`Send Assign: ${username} ${roles}`)
        this.socketService.server.emit('action',{type: 'assign', user: username, byUser: byUser, roles:roles})
        return `Send Command`
    }

    @Post('/roleUnassign')
    @Authorized(4 | ApiPermission.ExecServers)
    unassignRole(@BodyParam('username') username: string,@BodyParam('byUser') byUser: string,@BodyParam('roles') roles: Array<string>) {
        log('info',`Send Unassign: ${username} ${roles}`)
        this.socketService.server.emit('action',{type: 'unassign', user: username, byUser: byUser, roles:roles})
        return `Send Command`
    }

    @Post('/ban')
    @Authorized(4 | ApiPermission.ExecServers)
    ban(@BodyParam('username') username: string,@BodyParam('reason') reason: string) {
        log('info',`Send Ban: ${username} ${reason}`)
        this.socketService.server.emit('action',{type: 'ban', user: username, reason: reason})
        return `Send Command`
    }

    @Post('/unban')
    @Authorized(4 | ApiPermission.ExecServers)
    unban(@BodyParam('username') username: string) {
        log('info',`Send Unban: ${username}`)
        this.socketService.server.emit('action',{type: 'unban', user: username})
        return `Send Command`
    }
    
}