import { Service } from 'typedi';
import { Column, Entity, EntityRepository, ManyToOne, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { errorLog } from '../lib/log';
import { DiscordAccount } from './user.discord.entity';

const voteDownStrength = -2
const voteUpStrength = 1

export enum VoteType {
    'Neutral',
    'Upvote',
    'Downvote'
}

@Service()
@Entity()
export class DiscordUserVote {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    type: VoteType

    @ManyToOne(type => DiscordAccount, user => user.votes,{
        cascade: ['update', 'insert']
    })
    byDiscordUser: DiscordAccount

    @ManyToOne(type => DiscordAccount,{
        cascade: ['update', 'insert']
    })
    onDiscordUser: DiscordAccount
}

@Service()
@EntityRepository(DiscordUserVote)
export class DiscordUserVoteRepository extends Repository<DiscordUserVote> {

    public findVotesOnUser(userID: string, voteType?: VoteType): Promise<DiscordUserVote[]> {
        if (voteType) {
            return this.createQueryBuilder('vote')
                .leftJoinAndSelect('vote.onDiscordUser', 'user')
                .where('user.id = :userID')
                .andWhere('vote.type = :voteType')
                .setParameters({ userID, voteType })
                .getMany()
        } else {
            return this.createQueryBuilder('vote')
                .leftJoinAndSelect('vote.onDiscordUser', 'user')
                .where('user.id = :userID')
                .setParameters({ userID })
                .getMany()
        }
    }

    public async sumVotesOnUser(userID: string): Promise<number> {
        try {
            const votes = await this.findVotesOnUser(userID)
            let ctn = 0
            votes.forEach(vote => {
                switch (vote.type) {
                    case VoteType.Upvote: {
                        ctn+= voteUpStrength
                    } break
                    case VoteType.Downvote: {
                        ctn+= voteDownStrength
                    } break
                }
            })
            return ctn
        } catch (err) {
            errorLog(err)
        }
    }

}