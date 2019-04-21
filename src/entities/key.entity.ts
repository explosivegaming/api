import { Service } from 'typedi';
import { Column, Entity, EntityRepository, ManyToOne, PrimaryGeneratedColumn, Repository } from 'typeorm';
import { debugLog } from '../lib/log';
import { Account } from './user.entity';
import { HttpError } from 'routing-controllers';

// 1 2 and 4 will always be view write exec and should can be called without calling the enum
// as a result of this permission 7 will have full access
// example @Authorized(1 | ApiPermission.ViewUsers)
// example @Authorized(2 | ApiPermission.WriteVotes)
export enum ApiPermission {
    'ReadAll' = 1<<0,
    'WriteAll' = 1<<1,
    'ExecAll' = 1<<2,
    'ReadUsers' = 1<<3,
    'ExecUsers' = 1<<4,
    'ReadVotes' = 1<<5,
    'WriteVotes' = 1<<6,
    'ReadServers' = 1<<7,
    'WriteServers' = 1<<8,
    'ExecServers' = 1<<9,
    'ReadRoles' = 1<<10,
    'WriteRoles' = 1<<11
}

export function permissionsToBitmask(permissions: Array<ApiPermission> | ApiPermission | number): number {
    if (!(permissions instanceof Array)) {
        permissions = [permissions]
    }
    let mask = 0
    permissions.forEach(flag => {
        mask |= flag
    })
    return mask
}

@Service()
@Entity()
export class UserKey {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(type => Account, account => account.keys)
    account: Account

    @Column()
    permissions: number

}

@Service()
@EntityRepository(UserKey)
export class KeyRepository extends Repository<UserKey> {
    
    public async generateNewKey(account: Account,permissions: Array<ApiPermission> | number): Promise<string|HttpError> {
        if (typeof permissions !== 'number') {
            permissions = permissionsToBitmask(permissions)
        }
        const accountPermissions = permissionsToBitmask(account.permissions)
        if (permissions == 0 || (permissions | accountPermissions) == accountPermissions) {
            debugLog('Generated new key')
            const newKey = new UserKey()
            newKey.permissions = permissions
            newKey.account = account
            const newKeyInsert = await this.insert(newKey)
            return newKeyInsert.identifiers[0].id
        } else {
            throw new HttpError(401,`Missing permissions: ${permissions & ~accountPermissions}`)
        }
    }

    public async validateKeyOwnership(account: Account,key: string): Promise<boolean> {
        const found = await this.findOne({ where: { account: account, id: key }})
        return found ? true : false
    }

    public async validateKey(key: string): Promise<boolean> {
        const found = await this.findOne({ where: { id: key }})
        return found ? true : false
    }

    public async keyHasPermission(key: string,action: ApiPermission | Array<ApiPermission> | number) {
        const actionBitmask = permissionsToBitmask(action)
        const found = await this.findOne({ where: { id: key }})
        if (!found) {
            return false
        } else {
            if (actionBitmask == 0) return true
            return found.permissions & actionBitmask ? true : false
        }
    }

    public async accountHasPermission(account: Account,action: ApiPermission | Array<ApiPermission> | number) {
        const actionBitmask = permissionsToBitmask(action)
        if (actionBitmask == 0) return true
        return account.permissions & actionBitmask ? true : false
    }

}