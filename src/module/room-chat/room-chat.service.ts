import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import { RoomChatMessage } from "src/database/room-message-chat";
import { CreateRoomMessageDto } from "src/dto/create-room.dto";
import { RedisService } from "src/redis/redis.service";
import { SocketGateway } from "src/socket/socket.gateway";


@Injectable()
export class RoomChatService {
    constructor(
        @InjectModel(RoomChatMessage.name) private RoomChat: Model<RoomChatMessage>,
        private readonly socketGateway: SocketGateway,
        private readonly redisService: RedisService
    ) { }


    async createRoomChat(data: CreateRoomMessageDto) {
        try {
            const usernames = data.usernames.map(user => user.username)
            const ids = data.usernames.map(user => user.id)
            const userOnRoom = await this.RoomChat.find({ usernames: { $all: usernames } })
            console.log(userOnRoom)
            if (userOnRoom.length != 0) {
                for (const userId of ids) {
                    await this.socketGateway.server.in(userId).socketsJoin(userOnRoom[0]._id.toString());
                }

                return "room already exists"
            }
            const room = await this.RoomChat.create({ "usernames": usernames });

            for (const userId of ids) {
                await this.socketGateway.server.in(userId).socketsJoin(room._id.toString());
            }
            const dataRoom = await this.socketGateway.server.in(room._id.toString()).fetchSockets()
            return dataRoom;
        }
        catch (error) {
            throw new Error(error)
        }
    }

    @Cron('45 * * * * *')
    async asyncMessageRoom() {
        let newMessages = {};
        let allMessages = {};
        const roomNames = await this.redisService.getAllRoom();
        for (const room of roomNames) {
            const messageSended = await this.RoomChat.findById(room);
            allMessages[room] = messageSended.messages
            const messageRoom = await this.redisService.getRoomByKey(room);
            newMessages[room] = messageRoom.replace(/\\/g, '');
            allMessages[room].push(newMessages[room]);
            console.log(allMessages[room]);
            await this.RoomChat.findByIdAndUpdate({ _id: room }, { messages: allMessages[room] })
            this.redisService.resetRedis()
            // const data = await this.RoomChat.find();
            return newMessages;
        }
    }
}