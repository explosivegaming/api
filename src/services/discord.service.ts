import * as Discord from 'discord.js';
import { EventEmitter } from 'events';
import { Service } from 'typedi';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { AccountRepository } from '../entities/user.entity';
import { log, debugLog } from '../lib/log';
import { getCustomRepository } from 'typeorm';
import { FactorioRoleRepository } from '../entities/role.factorio.entity';

const maxDiscordMessageLength = 2000

export interface DiscordBotCommand {
    name: string,
    args: Array<string>,
    message: Discord.Message,
    user: Discord.User,
    member: Discord.GuildMember
}

export interface DiscordBotCommandHelp {
    name: string,
    params: string,
    usage: string,
    restriction?: string
}

@Service()
export class DiscordService extends EventEmitter {
    client: Discord.Client
    clientToken: string
    devGuild: Discord.Guild | null
    botCommands: Array<DiscordBotCommandHelp>

    //@InjectRepository()
    private accountRepo: AccountRepository

    private factorioRoleRepo: FactorioRoleRepository

    constructor() {
        super()
        this.client = new Discord.Client()
        this.clientToken = process.env.DISCORD_BOT_KEY
        this.botCommands = []
        this.accountRepo = getCustomRepository(AccountRepository)
        this.factorioRoleRepo = getCustomRepository(FactorioRoleRepository)
    }

    init() {
        this.client.login(this.clientToken)
        this.devGuild = null

        this.client.on('ready',() => {
            log('success','Discord bot login successful')
            if (process.env.DISCORD_DEV_GUILD) {
                this.devGuild = this.client.guilds.get(process.env.DISCORD_DEV_GUILD)
            }
        })

        this.client.on('message',message => {
            if (process.env.NODE_ENV === 'development' && message.guild !== this.devGuild) return
            if (message.author.bot) return
            if (!message.content.startsWith(process.env.COMMAND_PREFIX)) return

            const rawArgs = message.content.split(' ')
            const commandName = rawArgs.shift().substring(process.env.COMMAND_PREFIX.length).toLowerCase()
            debugLog(`Received command: <${commandName}>`)
            
            const args = []
            let currentIndex: number = 0
            let joinArg: boolean = false
            rawArgs.forEach(arg => {
                // if join arg is true the it will be appended to the last arg
                if (joinArg) {
                    args[currentIndex]+=' '+arg
                } else {
                    args.push(arg)
                    currentIndex++
                }
                // if the arg includes " and is not escaped by \ then joinArg is toggled
                if (arg.includes('"')) {
                    if (arg[arg.lastIndexOf('"')-1] !== '\\') {
                        joinArg = !joinArg
                    }
                }
            })

            const command: DiscordBotCommand = {
                name: commandName,
                args: args,
                message: message,
                user: message.author,
                member: message.member
            }
            if (!this.emit('command/'+commandName,command)) {
                this.removeAndReply(message,`Invalid Command! Try ${process.env.COMMAND_PREFIX}help`)
            }
        })

        require('../commands.discord/index')

        log('status','Initialized <discord.service>')
    }

    // sends a long message, will break the message up into parts so that it will not hit max char limit
    sendLongMessage(channel: Discord.TextChannel | Discord.DMChannel | Discord.GroupDMChannel | Discord.User, message: string) {
        function addToMessages(messages:Array<string>,text:string,join: string = ' ') {
            if (messages[messages.length-1].length+text.length < maxDiscordMessageLength) {
                messages[messages.length-1]+=join+text
            } else {
                messages.push(message)
            }
        }

        if (message.length < maxDiscordMessageLength) {
            return channel.send(message)
        } else {
            const messages = ['']
            let newlines: Array<string> = message.split('\n')
            newlines.forEach(line => {
                if (line.length < maxDiscordMessageLength) {
                    // the line is less than the max allowed length
                    addToMessages(messages,line,'\n')
                } else {
                    // the line is still too big to fit in a single message
                    let fullstop = line.lastIndexOf('.',maxDiscordMessageLength)
                    let space = line.lastIndexOf(' ',maxDiscordMessageLength)
                    if (fullstop > 0) {
                        // gets split at the fullstop
                        addToMessages(messages,line.substring(0,fullstop))
                        addToMessages(messages,line.substring(fullstop))
                    } else if (space > 0) {
                        // gets split at the space
                        addToMessages(messages,line.substring(0,space))
                        addToMessages(messages,line.substring(space))
                    } else {
                        // gets split at the max length
                        addToMessages(messages,line.substring(0,maxDiscordMessageLength-1))
                        addToMessages(messages,line.substring(maxDiscordMessageLength-1))
                    }
                }
            })
            return Promise.all(messages.map(message => channel.send(message)))
        }
    }

    // removes a message and replies to it
    removeAndReply(replyTo: Discord.Message, text: string, delay: number = 5000): void {
        replyTo.reply(text).then(message => {
            (message as Discord.Message).delete(delay)
        })
        replyTo.delete()
    }

    // gets the user's info
    async getUserInfo(id: string | Discord.User) {
        const account = await this.accountRepo.getByDiscord(id)
        return account.discord
    }

    // adds a command to the help command
    addCommandToHelp(command:DiscordBotCommandHelp): void
    addCommandToHelp(command:string,usage?:string,params?:string,restriction?:string): void
    addCommandToHelp(command,usage='',params='',restriction?): void {
        if (typeof command === 'string') {
            this.botCommands.push({
                name: command,
                params: params,
                usage: usage,
                restriction: restriction
            })
        } else {
            this.botCommands.push(command)
        }
    }

    // gets the roles of every guild the bot is in, if userKey is undefined will return roleName:{guildId:roleId} else roleName:[user[userKey]] ie display name etc
    getRoles(roleKey: string = 'id',userKey?: string) {
        const roles = {}
        this.client.guilds.forEach(guild => {
            guild.roles.forEach(role => {
                if (userKey) {
                    if (!roles[role[roleKey]]) {
                        roles[role[roleKey]] = []
                    }
                    role.members.forEach(member => {
                        if (!roles[role[roleKey]].includes(member[userKey])) {
                            roles[role[roleKey]].push(member[userKey])
                        }
                    })
                } else {
                    if (!roles[role.name]) {
                        roles[role.name] = {}
                    }
                    roles[role.name][guild.id] = role.id
                }
            })
        })
        return roles
    }

    getUserRoles(roleKey: string = 'id',userKey: string = 'id') {
        const roles = this.getRoles(roleKey,userKey)
        const users = {}
        for (let roleName in roles) {
            roles[roleName].forEach(user => {
                if (!users[user]) users[user] = []
                if (!users[user].includes(roleName)) users[user].push(roleName)
            })
        }
        return users
    }

    async getDiscordRoleSync(userKey: string = 'id') {
        const discordMapping = await this.factorioRoleRepo.getDiscordMapping()
        const userRoles = this.getUserRoles('id',userKey)
        const factorioUserRoles = {}
        for (let user in userRoles) {
            userRoles[user].forEach(role => {
                if (discordMapping[role] && !factorioUserRoles[user]) factorioUserRoles[user] = []
                if (discordMapping[role] && !factorioUserRoles[user].includes(discordMapping[role])) {
                    factorioUserRoles[user].push(discordMapping[role])
                }
            })
        }
        return factorioUserRoles
    }

}