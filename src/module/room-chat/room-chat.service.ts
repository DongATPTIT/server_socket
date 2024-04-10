import { InjectRedis } from "@nestjs-modules/ioredis";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Redis } from "ioredis";
import { Model } from "mongoose";
import { RoomChatMessage } from "src/database/room-message-chat";
import { CreateRoomMessageDto } from "src/dto/create-room.dto";
// import { CreateRoom } from "src/dto/create-room.dto";
import { SocketGateway } from "src/socket/socket.gateway";


@Injectable()
export class RoomChatService {
    constructor(
        @InjectModel(RoomChatMessage.name) private RoomChat: Model<RoomChatMessage>,
        private readonly socketGateway: SocketGateway,
        @InjectRedis() private readonly redis: Redis,
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

            console.log(room._id.toString())
            for (const userId of ids) {
                await this.socketGateway.server.in(userId).socketsJoin(room._id.toString());
            }
            const dataRoom = await this.socketGateway.server.in(room._id.toString()).fetchSockets()

            return dataRoom;
        }
        catch (error) { }
    }

    // @Cron('45 * * * * *')
    async asyncMessageRooom() {
        let messages = {};
        const roomNames = await this.redis.keys('*');
        for (const room of roomNames) {
            const messageRoom = await this.redis.get(room);
            messages[room] = messageRoom.replace(/\\/g, '')
            console.log(`messageRoom+${messageRoom}`)
            const update = await this.RoomChat.findByIdAndUpdate({ _id: room }, { messages: messages[room] })
            console.log(`update + ${update}`)
            // const data = await this.RoomChat.find();
            // console.log(`data +${data}`);
            return messages;
        }
    }
}