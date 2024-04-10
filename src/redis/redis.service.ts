import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable } from "@nestjs/common";
import { Redis } from "ioredis";


@Injectable()
export class RedisService {
    constructor(@InjectRedis() private readonly redis: Redis) { }


    async getAllRoom() {
        try {
            return await this.redis.keys('*')
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async getRoomByKey(key: string) {
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async SetMessageByKey(key: string, message: string) {
        try {
            return await this.redis.set(key, message);
        }
        catch (error) {
            throw new Error(error);
        }
    }

    async resetRedis() {
        return await this.redis.flushall()
    }
}