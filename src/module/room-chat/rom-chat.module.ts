import { Module } from "@nestjs/common";
import { RoomChatService } from "./room-chat.service";
import { RoomChatController } from "./room-chat.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { RoomChatMessage, RoomChatMessageSchema } from "src/database/room-message-chat";
import { SocketGateway } from "src/socket/socket.gateway";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [
        MongooseModule.forFeature([{ name: RoomChatMessage.name, schema: RoomChatMessageSchema }]),
        ScheduleModule.forRoot()
    ],
    providers: [RoomChatService, SocketGateway],
    controllers: [RoomChatController],
    exports: []
})
export class RoomChatModule {
}