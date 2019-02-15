import { Service } from 'typedi';
import { Column, Entity, EntityRepository, ManyToOne, PrimaryGeneratedColumn, Repository, getCustomRepository } from 'typeorm';
import { HttpError } from 'routing-controllers';
import moment = require('moment');

@Service()
@Entity()
export class ServerDetail {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    identifer: string

    @Column()
    name: string

    @Column()
    description: string

    @Column()
    resetDelay: string
    // ASP.NET 7 23:59:59 days hours:minutes:seconds

    @Column()
    syncVersion: string
    // Maj.Min.Pat

    @Column()
    autoSync: boolean

}

@Service()
@EntityRepository(ServerDetail)
export class ServerDetailsRepository extends Repository<ServerDetail> {

    public getByUid(uid: string) {
        return this.findOne({ id: uid })
    }

    public getByIdentifer(identifer: string) {
        return this.findOne({ identifer: identifer })
    }

    // serverId is short hand for uid or identifer
    public async getByServerId(id: string) {
        const details = await this.getByIdentifer(id)
        if (details) {
            return details
        } else {
            return this.getByUid(id)
        }
    }

    public async getResetDate(serverId: string) {
        const details = await this.getByServerId(serverId)
        if (details) {
            const now = moment()
            return now.add(moment.duration(details.resetDelay))
        } else {
            throw new HttpError(404,`Could not find server: ${serverId}`)
        }
    }

}