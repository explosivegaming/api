import * as Redis from 'ioredis';
import { Service } from 'typedi';
import { log } from '../lib/log';

@Service()
export class RedisService {
    client: Redis.Redis

    constructor() {
        this.client = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT) || 6379
        });
        log('status','Initialized <redis.service>')
    }

}