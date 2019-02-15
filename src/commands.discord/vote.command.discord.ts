import { Container } from 'typedi';
import { getCustomRepository } from 'typeorm';
import { DiscordAccount } from '../entities/user.discord.entity';
import { DiscordUserVote, DiscordUserVoteRepository, VoteType } from '../entities/vote.discord.entity';
import { DiscordBotCommand, DiscordService } from '../services/discord.service';

const discordBot = Container.get(DiscordService)
const discordVoteRepository = getCustomRepository(DiscordUserVoteRepository)

async function getVote(byDiscordUser: DiscordAccount, onDiscordUser: DiscordAccount): Promise<DiscordUserVote> {
    const vote = await discordVoteRepository.findOne({ byDiscordUser: byDiscordUser, onDiscordUser: onDiscordUser })
    if (vote) {
        return vote
    } else {
        const newVote = discordVoteRepository.create()
        newVote.byDiscordUser = byDiscordUser
        newVote.onDiscordUser = onDiscordUser
        return newVote
    }
}

discordBot.addCommandToHelp('upvote','Upvotes a user, can only be done once per user, will cancel downvote if present','<username>')
discordBot.on('command/upvote',async (command: DiscordBotCommand) => {
    const discordUser = await discordBot.getUserInfo(command.user)
    const onUserName = command.args[0]
    const onMember = command.message.guild.members.find(member => member.displayName.toLowerCase() == onUserName.toLowerCase())
    if (!onMember) {
        discordBot.removeAndReply(command.message,'Invalid Username, please make sure it is the name of the user on this server')
    } else {
        const onDiscordUser = await discordBot.getUserInfo(onMember.user)
        const vote = await getVote(discordUser,onDiscordUser)
        if (vote.type === VoteType.Downvote) {
            vote.type = VoteType.Neutral
        } else {
            vote.type = VoteType.Upvote
        }
        discordVoteRepository.save(vote)
        discordBot.removeAndReply(command.message,`Your vote for ${onDiscordUser.name} has been changed to: ${VoteType[vote.type]}`,3000)
    }
})

discordBot.addCommandToHelp('downvote','Downvotes a user, can only be done once per user, will cancel upvote if present','<username>')
discordBot.on('command/downvote',async (command: DiscordBotCommand) => {
    const discordUser = await discordBot.getUserInfo(command.user)
    const onUserName = command.args[0]
    const onMember = command.message.guild.members.find(member => member.displayName.toLowerCase() == onUserName.toLowerCase())
    if (!onMember) {
        discordBot.removeAndReply(command.message,'Invalid Username, please make sure it is the name of the user on this server')
    } else {
        const onDiscordUser = await discordBot.getUserInfo(onMember.user)
        const vote = await getVote(discordUser,onDiscordUser)
        if (vote.type === VoteType.Upvote) {
            vote.type = VoteType.Neutral
        } else {
            vote.type = VoteType.Downvote
        }
        discordVoteRepository.save(vote)
        discordBot.removeAndReply(command.message,`Your vote for ${onDiscordUser.name} has been changed to: ${VoteType[vote.type]}`,3000)
    }
})