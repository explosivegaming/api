import { Service } from 'typedi';
import { Column, Entity, EntityRepository, PrimaryGeneratedColumn, Repository, ManyToMany, getCustomRepository } from 'typeorm';
import { cleanLog } from '../lib/log';
import { FactorioAccount, FactorioAccountRepository } from './user.factorio.entity';
import { HttpError } from 'routing-controllers';

@Entity()
export class FactorioRole {

    constructor(name:string) {
        this.name = name
        this.discordRoles = []
    }

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column('simple-array')
    discordRoles: Array<string>

    @ManyToMany(type => FactorioAccount,account => account.roles)
    accounts: Array<FactorioAccount>

}

@Service()
@EntityRepository(FactorioRole)
export class FactorioRoleRepository extends Repository<FactorioRole> {
    
    constructor() {
        super()
        this.factorioRepo = getCustomRepository(FactorioAccountRepository)
    }

    private factorioRepo: FactorioAccountRepository

    public async getUsers(roleName: string) {
        const role = await this.findOne({ name:roleName},{ relations: ['accounts'] })
        return Promise.all(role.accounts.map(factorioAccount => this.factorioRepo.getByName(factorioAccount.name)))
    }

    public async getByName(roleName: string) {
        const role = await this.findOne({ name:roleName },{ relations: ['accounts'] })
        if (role) {
            role.accounts = await this.getUsers(roleName)
            return role
        }
    }

    public async linkToDiscord(roleName: string, discordRoleId: string) {
        let role = await this.getByName(roleName)
        if (!role) {
            cleanLog('debug',`Created new <factorio> role`)
            role = new FactorioRole(roleName)
        }
        if (role.discordRoles.indexOf(discordRoleId) >= 0) {
            return new HttpError(400,`Discord role <${discordRoleId}> is already linked to this role`)
        }
        cleanLog('info',`Link factorioRole<${roleName}> to discordRole<${discordRoleId}>`)
        role.discordRoles.push(discordRoleId)
        return this.save(role)
    }

    public async unlinkFromDiscord(roleName: string, discordRoleId: string) {
        const role = await this.getByName(roleName)
        if (role) {
            const index = role.discordRoles.indexOf(discordRoleId)
            if (!index) return new HttpError(400,`Discord role <${discordRoleId}> if not linked to this role`)
            cleanLog('info',`Unlinked factorioRole<${roleName}> from discordRole<${discordRoleId}>`)
            role.discordRoles.splice(index,1)
            if (role.discordRoles.length > 0) {
                return this.save(role)
            } else {
                await this.delete(role.id)
                return 'Removed role: '+role.name
            }
        }
    }

    public async getDiscordMapping() {
        const roles = await this.find()
        const rtn = {}
        roles.forEach(role => {
            role.discordRoles.forEach(discordRole => rtn[discordRole] = role.name)
        })
        return rtn
    }

}