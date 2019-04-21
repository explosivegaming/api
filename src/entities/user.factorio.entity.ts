import { Service } from 'typedi';
import { Column, Entity, EntityRepository, OneToOne, PrimaryGeneratedColumn, Repository, ManyToMany, JoinTable } from 'typeorm';
import { debugLog, errorLog } from '../lib/log';
import { Account, AccountRelations } from './user.entity';
import { FactorioRole } from './role.factorio.entity';

@Entity()
export class FactorioAccount {

    constructor(name:string) {
        this.name = name
    }

    @PrimaryGeneratedColumn('uuid')
    id: string

    @OneToOne(type => Account, account => account.factorio)
    account: Account

    @Column()
    name: string

    @ManyToMany(type => FactorioRole,role => role.accounts)
    @JoinTable()
    roles: Array<FactorioRole>

}

@Service()
@EntityRepository(FactorioAccount)
export class FactorioAccountRepository extends Repository<FactorioAccount> {
    
    public async getByName(username: string) {
        try {
            const found = await this.findOne({ name: username }, { relations: ['roles'].concat(AccountRelations) })
            if (found) {
                return found
            } else {
                debugLog(`Created new <factorio> account`)
                const factorioUser = new FactorioAccount(username)
                await this.insert(factorioUser)
                return await this.findOne({ name: username }, { relations: ['roles'].concat(AccountRelations) })
            }
        } catch (err) {
            errorLog(err)
        }
    }

}