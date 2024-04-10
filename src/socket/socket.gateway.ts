import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Socket, Server } from 'socket.io';
import axios from 'axios';
import { InjectModel } from "@nestjs/mongoose";
import { RoomChatMessage } from "src/database/room-message-chat";
import mongoose, { Model } from "mongoose";
import { Redis } from "ioredis";
import { InjectRedis } from "@nestjs-modules/ioredis";
import { PayloadMessage } from "src/dto/payload-message.dto";
@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class SocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        @InjectModel(RoomChatMessage.name) private RoomChat: Model<RoomChatMessage>,
        @InjectRedis() private readonly redis: Redis,
    ) { }

    @WebSocketServer() server: Server;
    async handleConnection(client: Socket) {
        const token = client.handshake?.headers?.token;
        console.log(token);
        axios.get(`http://10.10.150.57:3000/auth/check-auth-token`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(async (res) => {
                client.data = { username: res.data?.username };
                client.connected;
                console.log(client.data.username)
                const rooms = await this.RoomChat.find({ usernames: { $in: [client.data.username] } })

                const roomName = rooms.map(room => room._id.toString());
                let messageOnRooms = {}
                for (const room of roomName) {
                    client.join(room);
                    // client.on('chat', (message) => {
                    //     console.log(message)
                    // })
                    const messageRoomOnRedis = await this.redis.get(room);
                    const messageOnDb = await this.RoomChat.findById(room)
                    messageOnRooms[room] = messageOnRooms ? messageRoomOnRedis : messageOnDb.messages;
                }
                console.log(messageOnRooms)
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

        console.log({
            msg: `username: ${client.data.username}`,
            content: payload.content,
            room: payload.roomName
        });
        client.to(payload.roomName).emit('chat', {
            payload
        });
        const oldMessages = await this.redis.get(payload.roomName);

        let messages = [];

        if (oldMessages) {
            messages.push(await this.redis.get(payload.roomName));
        }
        const newMessage = {
            _id: new mongoose.Types.ObjectId(),
            username: client.data.username,
            message: payload.content,
            timestamp: new Date()
        };
        messages.push(newMessage);

        await this.redis.set(payload.roomName, JSON.stringify(messages));

        console.log(await this.redis.get(payload.roomName));

    }

}