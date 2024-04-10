import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RoomChatService } from "./room-chat.service";
// import { CreateRoom } from "src/dto/create-room.dto";
import { Socket, Server } from 'socket.io';
import { WebSocketServer } from "@nestjs/websockets";
import { SocketGateway } from "src/socket/socket.gateway";
@Controller()
export class RoomChatController {
    constructor(
        private readonly RoomChat: RoomChatService,
        private readonly socketGateway: SocketGateway
    ) { }
    @Post('create-room')
    async createRoomChat(@Body() data: any, socket: Socket,) {
        try {
            const room = await this.RoomChat.createRoomChat(data);
        }
        catch (err) {
            console.log(err);
        }
    }
    @Post('send-message')
    async sendMessageToRoom(@Body() messageDto: any) {
        const roomName = messageDto.roomName;
        const messageContent = messageDto.content;

        try {
            this.socketGateway.server.to(roomName).emit('chat', messageContent);
            return { success: true, message: 'Tin nhắn đã được gửi thành công' };
        } catch (error) {
            return { success: false, message: 'Đã có lỗi xảy ra khi gửi tin nhắn' };
        }
    }

}