import { Container } from 'typedi';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';

const discordBot = Container.get(DiscordService)

discordBot.addCommandToHelp('help','Displays list of all commands in your dms')
discordBot.on('command/help',(command: DiscordBotCommand) => {
    let helpMessage = '__**Commands:**__\n'
    discordBot.botCommands.forEach(helpCommand => {
        helpMessage+=`${process.env.COMMAND_PREFIX+helpCommand.name} ${helpCommand.params}${helpCommand.restriction ? ' - '+helpCommand.restriction : ''} - \`${helpCommand.usage}\`\n`
    })
    discordBot.sendLongMessage(command.user,helpMessage)
    command.message.delete()
})