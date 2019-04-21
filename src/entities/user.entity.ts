import { User } from 'discord.js';
import { Service } from 'typedi';
import { Column, Entity, EntityRepository, getCustomRepository, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { debugLog, errorLog } from '../lib/log';
import { DiscordAccountRepository } from './user.discord.entity';
import { DiscordAccount } from './user.discord.entity';
import { FactorioAccount, FactorioAccountRepository } from './user.factorio.entity';
import { KeyRepository, UserKey } from './key.entity';

export enum AccountType {
    'discord',
    'factorio'
}

export function getAccountTypeName(subAccount: unknown): string {
    const type = getAccountType(subAccount)
    if (type >= 0) {
        return AccountType[type]
    } else {
        return 'INVALID'
    }
}

export function getAccountType(subAccount: unknown): AccountType {
    if (subAccount instanceof DiscordAccount) {
        return AccountType.discord
    } else if (subAccount instanceof FactorioAccount) {
        return AccountType.factorio
    } else {
        return -1
    }
}

export const AccountRelations = [
    'account',
    'account.discord',
    'account.factorio'
]

export const AccountRepositoryRelations = [
    'discord',
    'factorio'
]

@Entity()
export class Account {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @OneToOne(type => DiscordAccount, user => user.account,{
        cascade: ['update', 'insert']
    })
    @JoinColumn()
    discord: DiscordAccount

    @OneToOne(type => FactorioAccount, user => user.account,{
        cascade: ['update', 'insert']
    })
    @JoinColumn()
    factorio: FactorioAccount

    @OneToMany(type => UserKey, key => key.account,{
        cascade: ['update', 'insert']
    })
    keys: UserKey

    @Column()
    permissions: number

}

@Service()
@EntityRepository(Account)
export class AccountRepository extends Repository<Account> {
    
    constructor() {
        super()
        // because @InjectRepository does not want to work
        this.discordUsers = getCustomRepository(DiscordAccountRepository)
        this.factorioUsers = getCustomRepository(FactorioAccountRepository)
        this.keys = getCustomRepository(KeyRepository)
    }

    //@InjectRepository()
    discordUsers: DiscordAccountRepository

    //@InjectRepository()
    factorioUsers: FactorioAccountRepository

    //@InjectRepository()
    keys: KeyRepository

    public linkIfNull(account: Account, subAccount: any): boolean {
        const accountType = getAccountTypeName(subAccount)
        if (!subAccount.account && !account[accountType]) {
            // subAccount has no account and account does not have this sub account type
            account[accountType] = subAccount
            subAccount.account = account
            return true
        } else {
            // one of them has the other
            return false
        }
    }

    public linkIfAvailable(account: Account, subAccount: any): boolean {
        const accountType = getAccountTypeName(subAccount)
        if (!account[accountType] && !subAccount.account) {
            // sub account has no account and account does not have this sub account type
            account[accountType] = subAccount
            subAccount.account = account
            return true
        } else if (!subAccount.account) {
            // the sub account is not linked and can replace the old one
            account[accountType].account = undefined
            account[accountType] = subAccount
            subAccount.account = account
            return true
        } else {
            // the account already has this sub account type
            return false
        }
    }

    public linkSubAccounts(subAccountOne: any, subAccountTwo: any): boolean {
        const accountTypeOne = getAccountTypeName(subAccountOne)
        const accountTypeTwo = getAccountTypeName(subAccountTwo)
        if (!subAccountOne.account && !subAccountTwo.account) {
            // neither has an account so cant be tested
            return false
        } else if (!subAccountOne.account) {
            // sub one has no account and so if linked
            subAccountOne.account = subAccountTwo.account
            subAccountTwo.account[accountTypeOne] = subAccountOne
            return true
        } else if (!subAccountTwo.account) {
            // sub two has no account and so if linked
            subAccountTwo.account = subAccountOne.account
            subAccountOne.account[accountTypeTwo] = subAccountTwo
            return true
        } else {
            // both have the same account and are already linked
            return false
        }
    }

    private recursiveLink(account: Account): Account {
        for (let type in AccountType) {
            if (isNaN(Number(type))) {
                if (account[type]) {
                    account[type].account = account
                }
            }
        }
        return account
    }

    private async getByAccount(subAccount: unknown) {
        const accountType = getAccountTypeName(subAccount)
        const conditions = {}
        conditions[accountType] = subAccount
        const settings = { relations: AccountRepositoryRelations }
        const found = await this.findOne(conditions,settings)
        if (found) {
            return found
        } else {
            debugLog(`Created new <user> account`)
            const account = new Account()
            account[accountType] = subAccount
            account.permissions = 0
            await this.insert(account)
            return this.findOne(conditions,settings)
        }
    }

    public async getByDiscord(discordUser: DiscordAccount | string | User,blockRecursion?: boolean,username?:string) {
        try {
            if (discordUser instanceof User || typeof discordUser === 'string') {
                discordUser = await this.discordUsers.getById(discordUser,username)
            }
            const account = await this.getByAccount(discordUser)
            return blockRecursion && account || this.recursiveLink(account)
        } catch (err) {
            errorLog(err)
        }
    }

    public async getByFactorio(factorioUser: FactorioAccount | string,blockRecursion?: boolean) {
        try {
            if (typeof factorioUser === 'string') {
                factorioUser = await this.factorioUsers.getByName(factorioUser)
            }
            const account = await this.getByAccount(factorioUser)
            return blockRecursion && account || this.recursiveLink(account)
        } catch (err) {
            errorLog(err)
        }
    }

}