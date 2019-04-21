import { Authorized, Delete, Get, JsonController, Param } from 'routing-controllers';
import { Service } from 'typedi';
import { getCustomRepository } from 'typeorm';
import { ApiPermission } from '../entities/key.entity';
import { DiscordUserVoteRepository } from '../entities/vote.discord.entity';
import { log } from '../lib/log';

@Service()
@JsonController('/votes')
export class VoteController {

    constructor() {
        // because @InjectRepository does not want to work
        this.voteRepo = getCustomRepository(DiscordUserVoteRepository)
    }

    //@InjectRepository()
    private voteRepo: DiscordUserVoteRepository

    @Get('/by/:id')
    @Authorized(1 | ApiPermission.ReadVotes)
    by(@Param('id') id: string) {
        debugLog(`Sent votes by: <${id}>`)
        return this.voteRepo.find({ where: { byDiscordUser: id }})
    }

    @Get('/on/:id')
    @Authorized(1 | ApiPermission.ReadVotes)
    on(@Param('id') id: string) {
        debugLog(`Sent votes on: <${id}>`)
        return this.voteRepo.find({ where: { onDiscordUser: id }})
    }

    @Get('/sum/:id')
    @Authorized(1 | ApiPermission.ReadVotes)
    sum(@Param('id') id: string) {
        debugLog(`Sent vote sum on: <${id}>`)
        return this.voteRepo.sumVotesOnUser(id)
    }

    @Delete('/:id')
    @Authorized(2 | ApiPermission.WriteVotes)
    async delete(@Param('id') id: string) {
        await this.voteRepo.delete(id)
        debugLog(`Removed vote: ${id}`)
        return `Removed vote: ${id}`
    }

}