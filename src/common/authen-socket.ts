import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class SocketAuthGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(
        context: ExecutionContext,
    ): boolean {
        const token = context
            .switchToWs()
            .getClient()
            .handshake.auth?.token;
        console.log(token)
        return token === '[some_token]';
    }
}