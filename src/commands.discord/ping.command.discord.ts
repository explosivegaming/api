import { Message } from 'discord.js';
import { Container } from 'typedi';
import { log } from '../lib/log';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';

const discordBot = Container.get(DiscordService)

discordBot.addCommandToHelp('ping','Returns a pong to test that the bot is working','Admin and above')
discordBot.on('command/ping',async (command: DiscordBotCommand) => {
    debugLog('Received ping from: '+command.member.displayName)
    const msg = command.message
    const pingMsg = await msg.reply('Pinging...') as Message;
    msg.delete()

    await pingMsg.edit(`
        ${msg.channel.type !== 'dm' ? msg.author: ''}
        Pong! The message round-trip took ${pingMsg.createdTimestamp - msg.createdTimestamp}ms.
        ${discordBot.client.ping ? 'The heartbeat ping is '+Math.round(discordBot.client.ping)+'ms' : ''}
    `);

    pingMsg.delete(10000)
})