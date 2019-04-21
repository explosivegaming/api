import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { EventEmitter } from 'events';
import { log, errorLog } from '../lib/log';
import { Rcon } from 'rcon-ts'
import * as socketio from 'socket.io-client';
import { ServerDetail } from '../entities/server.details.entity';
import * as oneline from 'oneline'

dotenv.config({path:'src/client/.env'})

class RconClient extends Rcon {

    constructor() {
        super({
            host:process.env.RCON_HOST,
            port:Number(process.env.RCON_PORT),
            password:process.env.RCON_PWD
        })
        this.connect()
        .then(() => {
            log('Success',`Rcon connection created with: ${this.host}:${this.port}`)
        },errorLog)
    }

}

class SocketClient extends EventEmitter {

    socket: SocketIOClient.Socket

    constructor() {
        super()
        this.socket = socketio(process.env.SOCKET_HOST,{
            path: process.env.SOCKET_PATH,
            query: { key: process.env.CLIENT_KEY, serverId: process.env.SERVER_ID }
        })
    }

    init() {
        this.socket.on('connect',() => {
            log('success',`Socket connection created with: ${process.env.SOCKET_HOST}`)
        })
        
        this.socket.on('disconnect',reason => {
            log('warning',`Socket connection lost with: ${process.env.SOCKET_HOST} Reason: ${reason}`)
        })

        this.socket.on('error',error => {
            errorLog(`Error with socket connected to ${process.env.SOCKET_HOST}: ${error}`)
        })

        this.socket.on('action',action => {
            this.emit(action.type,action)
        })
    }

}

class Client {

    rconClient: RconClient
    socketClient: SocketClient

    constructor() {
        this.rconClient = new RconClient()
        this.socketClient = new SocketClient()
    }

    init() {
        this.socketClient.init()
        this.rconClient.send('Server Rcon Connection Restored').then(msg => debugLog('Rcon Connection Test Passed'))

        this.socketClient.on('sync',action => {
            log('info',`Received sync: ${action.area}`)
            switch(action.area) {
                case 'details': {
                    this.syncDetails()
                } break
                case 'roles': {
                    this.syncRoles()
                } break
            }
        })

        this.socketClient.on('rawCmd',action => {
            log('info',`Received command: ${action.cmd}`)
            this.rconClient.send(action.cmd)
        })

        this.socketClient.on('assign',action => {
            log('info',`Received assign: ${action.user} ${action.roles}`)
            let roleOutput = `{"${action.roles.join('","')}"}`
            this.rconClient.send(`/interface Sync.assign_role("${action.user}",${roleOutput},${action.byUser ? action.byUser : 'nil'})`)
        })

        this.socketClient.on('unassign',action => {
            log('info',`Received unassign: ${action.user} ${action.roles}`)
            let roleOutput = `{"${action.roles.join('","')}"}`
            this.rconClient.send(`/interface Sync.unassign_role("${action.user}",${roleOutput},${action.byUser ? action.byUser : 'nil'})`)
        })

        this.socketClient.on('ban',action => {
            log('info',`Received ban: ${action.user} ${action.reason}`)
            this.rconClient.send(`/ban ${action.user} ${action.reason}`)
        })

        this.socketClient.on('unban',action => {
            log('info',`Received unban: ${action.user}`)
            this.rconClient.send(`/unban ${action.user}`)
        })

    }

    syncDetails() {
        this.socketClient.socket.emit('details',(server: ServerDetail,time: string,date: string,reset: string) => {
            log('info',`Received data for sync`)
            this.rconClient.send(oneline`/interface Sync.info{
                server_name='${server.name}',
                server_description='${server.description}',
                time='${time}',
                date='${date}',
                reset_time='${reset}',
                branch='master'
            }`)
        })
    }

    syncRoles() {
        this.socketClient.socket.emit('roles',(roles: Array<string>) => {
            log('info',`Received data for sync`)
            this.rconClient.send(`/interface Sync.set_roles{${roles.join(',')}}`)
        })
    }

}

const client = new Client()
client.init()