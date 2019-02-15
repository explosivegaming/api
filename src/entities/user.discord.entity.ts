import { User } from 'discord.js';
import Container, { Service } from 'typedi';
import { Column, Entity, EntityRepository, OneToMany, OneToOne, PrimaryColumn, Repository } from 'typeorm';
import { cleanLog, errorLog } from '../lib/log';
import { DiscordService } from '../services/discord.service';
import { Account, AccountRelations } from './user.entity';
import { DiscordUserVote } from './vote.discord.entity';

@Entity()
export class DiscordAccount {
    
    constructor(id: string,name: string) {
        this.id = id
        this.name = name 
    }

    @PrimaryColumn()
    id: string

    @OneToOne(type => Account, account => account.discord)
    account: Account

    @Column()
    name: string

    @OneToMany(type => DiscordUserVote, vote => vote.byDiscordUser)
    votes: Array<DiscordUserVote>
}

@Service()
@EntityRepository(DiscordAccount)
export class DiscordAccountRepository extends Repository<DiscordAccount> {
    
    public async getById(user: string | User, username?: string) {
        try {
            if (typeof user == 'string') {
                const discordBot = Container.get(DiscordService)
                user = discordBot.client.users.get(user)
            }

            const found = await this.findOne({ id: user.id }, { relations: ['votes'].concat(AccountRelations) })
            if (found) {
                return found
            } else {
                cleanLog('debug',`Created new <discord> account`)
                const name = username || user.username
                const discordUser = new DiscordAccount(user.id,name)
                await this.insert(discordUser)
                return await this.findOne({ id: user.id }, { relations: ['votes'].concat(AccountRelations) })
            }
        } catch (err) {
            errorLog(err)
        }
    }

}