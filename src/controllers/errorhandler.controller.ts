import {Middleware, ExpressErrorMiddlewareInterface} from "routing-controllers";
import * as express from 'express'
 
@Middleware({ type: "after" })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
 
    error(error: Error, request: express.Request, response: express.Response) {
        if (process.env.NODE_ENV === 'production') {
            response.send(error.name+': '+error.message)
        } else {
            response.send(error.name+': '+error.message+'<br><br><br>'+error.stack)
        }
    }
 
}