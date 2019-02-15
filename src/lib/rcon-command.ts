import * as Rcon from 'simple-rcon'
import { resolve } from 'bluebird';

export interface rconDetails {
    host: string,
    port: number,
    password: string,
    key?: string
}

export function sendOnce(location: rconDetails, cmd: string) {
    return new Promise((resolve,reject) => {
        const client = new Rcon(location)
        .exec(cmd,res => {
            client.close()
            resolve(res)
        })
        .on('error',err => {
            client.close()
            reject(err)
        })
    })
}

export function send(location: rconDetails, cmd: string, maxRetry: number = 10, timeout: number = 50) {
    let retries = 0
    let result
    function retry(client) {
        return new Promise(resolve => {
            client.exec(cmd,resolve)
        })
    }
    function check(res) {
        result = res.body
        return true
    }
    return new Promise(async (resolve,reject) => {
        const client = new Rcon(location)
        .on('error',err => {
            if (retries > maxRetry) {
                return reject(err)
            } else {
                retries++
                setTimeout(async () => {
                    if (check(await retry(client))) {
                        return resolve(result)
                    }
                },timeout)
            }
        }).connect()
        if (check(await retry(client))) {
            return resolve(result)
        }
    })
}