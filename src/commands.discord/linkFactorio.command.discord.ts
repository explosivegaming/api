import Container from 'typedi';
import { getCustomRepository } from 'typeorm';
import { AccountRepository } from '../entities/user.entity';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';

const discordBot = Container.get(DiscordService)
const accountRepo = getCustomRepository(AccountRepository)

discordBot.addCommandToHelp('linkFactorio','Adds your factorio account name to your account','<factorio name>')
discordBot.on('command/linkfactorio',async (command: DiscordBotCommand) => {
    const account = await accountRepo.getByDiscord(command.user)
    const factorioName = command.args[0].toLowerCase()
    const factorioUser = await accountRepo.factorioUsers.getByName(factorioName)
    if (accountRepo.linkIfAvailable(account,factorioUser)) {
        // the factorio user had no account linked
        discordBot.removeAndReply(command.message,'Your Factorio username has been updated to: '+factorioName)
    } else if (factorioUser.account === account) {
        // the factorio user is already linked
        discordBot.removeAndReply(command.message,'You are already linked to this account!')
    } else if (factorioUser.account) {
        // the factorio user is linked to a different account
        discordBot.removeAndReply(command.message,'That name is already linked to another user!')
    }
    accountRepo.save(account)
})