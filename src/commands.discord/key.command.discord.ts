import Container from 'typedi';
import { getCustomRepository } from 'typeorm';
import { AccountRepository } from '../entities/user.entity';
import { ApiPermission } from '../entities/key.entity';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';

const discordBot = Container.get(DiscordService)
const accountRepo = getCustomRepository(AccountRepository)

discordBot.on('command/keygen',async (command: DiscordBotCommand) => {
    const account = await accountRepo.getByDiscord(command.user)
    const reply = await accountRepo.keys.generateNewKey(account,Number(command.args[0]))
    command.message.channel.send(reply)
    command.message.delete()
})

discordBot.on('command/keyauth',async (command: DiscordBotCommand) => {
    const account = await accountRepo.getByDiscord(command.user)
    const replyValid = await accountRepo.keys.validateKey(command.args[0])
    const replyOwnership = await accountRepo.keys.validateKeyOwnership(account,command.args[0])
    const replyPermission = command.args[1] ? await accountRepo.keys.keyHasPermission(command.args[0],Number(command.args[1])) : replyValid
    command.message.channel.send(`Valid: ${replyValid} Owner: ${replyOwnership} Permitted: ${replyPermission}`)
    command.message.delete()
})

discordBot.on('command/keyrevoke',async (command: DiscordBotCommand) => {
    const account = await accountRepo.getByDiscord(command.user)
    let reply = 'NOTOWNER'
    if (await accountRepo.keys.validateKeyOwnership(account,command.args[0])) {
        await accountRepo.keys.delete(command.args[0])
        reply = 'Key revoked'
    }
    command.message.channel.send(reply)
    command.message.delete()
})