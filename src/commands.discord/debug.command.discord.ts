import { Message } from 'discord.js';
import { Container } from 'typedi';
import { cleanLog } from '../lib/log';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';

const discordBot = Container.get(DiscordService)

discordBot.on('command/ping',async (command: DiscordBotCommand) => {
    cleanLog('debug','Received debug from: '+command.member.displayName)
    command.message.delete()
    //discordBot.client.guilds.get('260843215836545025').members.get('216303189073461248').addRoles(['525738033665015820'])
}) 