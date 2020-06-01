import { Get, QueryParam, Redirect, JsonController, Req, CurrentUser, Res, HttpError } from 'routing-controllers';
import { Service } from 'typedi';
import { getCustomRepository } from 'typeorm';
import { AccountRepository, Account } from '../entities/user.entity';
import request = require('request-promise');
import express = require('express');
import { log, errorLog, debugLog } from '../lib/log';

const btoa = require('btoa')

@Service()
@JsonController('/auth')
export class AuthController {

    
    constructor() {
        // because @InjectRepository does not want to work
        this.userRepo = getCustomRepository(AccountRepository)
        this.discordRedirect = encodeURIComponent(process.env.DISCORD_EXT_AUTH)
        this.discordCredentials = btoa(`${process.env.BOT_CLIENT_ID}:${process.env.BOT_CLIENT_SECRET}`)
    }

    //@InjectRepository()
    private userRepo: AccountRepository

    private discordRedirect: string
    private discordCredentials: string

    @Get('/me')
    user(@CurrentUser({ required: true }) user: Account) {
        debugLog(`Sent user data for: <${user.id}>`)
        return user;
    }

    @Get('/logout')
    logout(@Req() req: express.Request) {
        debugLog(`Logged out session for: <${req.session.user}>`)
        req.session.user = undefined
    }

    @Get('/login/discord')
    @Redirect('https://discordapp.com/api/oauth2/authorize?client_id=:client_id&redirect_uri=:redirect_uri&response_type=code&scope=identify')
    discordLogin() {
        return {
            client_id: process.env.BOT_CLIENT_ID,
            redirect_uri: this.discordRedirect
        }
    }

    @Get('/ext/discord')
    @Redirect('../me')
    async discordExt(@QueryParam('code',{ required: true }) authCode: string, @Req() req: express.Request, @Res() res: express.Response) {
        const authBody = await request({
            method: 'POST',
            url: `https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${authCode}&redirect_uri=${this.discordRedirect}`,
            headers: {
                Authorization: 'Basic '+this.discordCredentials
            }
        })
        const access_token = JSON.parse(authBody).access_token
        debugLog('Received discord access token')
        const accountBody = await request({
            method: 'GET',
            url: 'http://discordapp.com/api/users/@me',
            headers: {
                Authorization: 'Bearer '+access_token
            }
        })
        const userInfo = JSON.parse(accountBody)
        debugLog(`Received discord user data for: <${userInfo.id}>`)
        const account = await this.userRepo.getByDiscord(userInfo.id,true,userInfo.username)
        debugLog(`Found user account: <${account.id}>`)
        req.session.user = account.id
    }

    @Get('/keys')
    userKeys(@CurrentUser({ required: true }) user: Account) {
        debugLog('Sent user keys')
        return this.userRepo.keys.find({ where: { account: user } })
    }

    @Get('/keys/generate')
    async generateUserKey(@CurrentUser({ required: true }) user: Account, @QueryParam('permissions') permissions: string = '0', @Res() res: express.Response) {
        const key = await this.userRepo.keys.generateNewKey(user,Number(permissions))
        return res.send(key)
    }

    @Get('/keys/revoke')
    async revokeUserKey(@CurrentUser({ required: true }) user: Account, @QueryParam('key',{ required: true }) key: string, @Res() res: express.Response) {
        if (await this.userRepo.keys.validateKeyOwnership(user,key)) {
            await this.userRepo.keys.delete(key)
            debugLog('Revoked Key')
            return res.send('Key Revoked')
        } else {
            throw new HttpError(401,'Invalid key or Permission Denied.')
        }
    }

}