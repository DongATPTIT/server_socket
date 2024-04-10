import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomChatModule } from './module/room-chat/rom-chat.module';
import { SocketGateway } from './socket/socket.gateway';
import { APP_GUARD } from '@nestjs/core';
import { SocketAuthGuard } from './common/authen-socket';
import { RoomChatMessage, RoomChatMessageSchema } from './database/room-message-chat';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1/serversocket'),
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    RoomChatModule,
  ],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: SocketAuthGuard
    // }
  ],
  controllers: []
})
export class AppModule {
}