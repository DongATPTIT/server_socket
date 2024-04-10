import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from 'socket.io';
import axios from 'axios';
import { InjectModel } from "@nestjs/mongoose";
import { RoomChatMessage } from "src/database/room-message-chat";
import mongoose, { Model } from "mongoose";
import { Redis } from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { PayloadMessage } from "src/dto/payload-message.dto";
import { RedisService } from "src/redis/redis.service";
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @InjectModel(RoomChatMessage.name) private RoomChat: Model<RoomChatMessage>,
        private readonly redisService: RedisService
    ) { }

    @WebSocketServer() server: Server;
    async handleConnection(client: Socket) {
        const token = client.handshake?.headers?.token;
        axios.get(`${process.env.URL}/auth/check-auth-token`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(async (res) => {
                client.data = { username: res.data?.username };
                client.connected;
                const rooms = await this.RoomChat.find({ usernames: { $in: [client.data.username] } })

                const roomName = rooms.map(room => room._id.toString());
                let messageOnRooms = {}
                for (const room of roomName) {
                    client.join(room);
                    const messageRoomOnRedis = this.redisService.getRoomByKey(room);
                    const messageOnDb = await this.RoomChat.findById(room)
                    messageOnRooms[room] = messageOnRooms ? messageRoomOnRedis : messageOnDb.messages;
                }
                console.log(`Client connected: ${client.id}`);
                return messageOnRooms
            })
            .catch((err) => {
                console.log(err)
                client.disconnect(true);
            });
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`)
    }
    afterInit(server: any) {
        console.log(`server`);
    }
    @SubscribeMessage('chat')
    async handleSendMessage(client: Socket, payload: PayloadMessage): Promise<void> {
        client.to(payload.roomName).emit('chat', {
            payload
        });
        const messageSended = this.redisService.getRoomByKey(payload.roomName);

        let allMessage = [];

        if (messageSended) {
            allMessage.push(messageSended);
        }
        const newMessage = {
            _id: new mongoose.Types.ObjectId(),
            username: client.data.username,
            message: payload.content,
            timestamp: new Date()
        };
        allMessage.push(newMessage);

        this.redisService.SetMessageByKey(payload.roomName, JSON.stringify(allMessage));


    }

}