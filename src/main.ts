import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);
  // app.useGlobalGuards(new SocketAuthGuard)
  await app.listen(3002);
}
bootstrap();
