import { DMChannel, GroupDMChannel, GuildMember, RichEmbed, TextChannel, User } from 'discord.js';
import Container from 'typedi';
import { getCustomRepository } from 'typeorm';
import { AccountRepository } from '../entities/user.entity';
import { DiscordUserVoteRepository, VoteType } from '../entities/vote.discord.entity';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';
import moment = require("moment");

const discordBot = Container.get(DiscordService)
const voteRepo = getCustomRepository(DiscordUserVoteRepository)
const accountRepo = getCustomRepository(AccountRepository)

export async function sendUserInfoEmbed(channel: TextChannel | DMChannel | GroupDMChannel | User, member: GuildMember) {
    const user = member.user
    const upvotes = await voteRepo.findVotesOnUser(user.id,VoteType.Upvote)
    const downvotes = await voteRepo.findVotesOnUser(user.id,VoteType.Downvote)
    const account = await accountRepo.getByDiscord(user)
    let displayName = member.displayName
    if (account.factorio) {
        displayName = account.factorio.name
    }
    const embed = new RichEmbed()
        .setTitle(`${member.displayName}'s Information`)
        .setDescription(`They are currently ${user.presence.status}${user.presence.game ? ' and are playing: '+user.presence.game.name : ''}`)
        .setColor(member.displayColor)
        .setTimestamp()
        .setThumbnail(user.avatarURL)
        .setFooter(discordBot.client.user.username, discordBot.client.user.avatarURL)
        .addField('Username:',user.username,true).addField('Factorio/Nick Name:',displayName,true)
        .addField('Joined:',moment(member.joinedAt).fromNow(),true).addField('Last Message:',member.lastMessage ? moment(member.lastMessage.createdAt).subtract(1,'s').fromNow() : 'Unknown',true)
        .addField('Highest Role:',member.highestRole.name,true).addField('Server Role:',member.hoistRole ? member.hoistRole.name : 'User',true)
        .addField('Upvotes:',upvotes.length,true).addField('Downvotes:',downvotes.length,true)
    channel.send(embed)
}

discordBot.addCommandToHelp('info','Displays user information, if no name given then displays your information','[username]')
discordBot.on('command/info',(command: DiscordBotCommand) => {
    const onUserName = command.args[0]
    const onMember = onUserName && command.message.guild.members.find(member => member.displayName.toLowerCase() == onUserName.toLowerCase())
    if (!onMember) {
        sendUserInfoEmbed(command.message.channel,command.message.member)
    } else {
        sendUserInfoEmbed(command.message.channel,onMember)
    }
})