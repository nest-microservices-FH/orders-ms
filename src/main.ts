import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { envs } from './config';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const logger= new Logger('Main Orders')
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport:Transport.NATS,
    options:{
      servers:envs.NATS_SERVERS
    }
  });

  await app.listen();
  
  logger.log(`Orders Micro Service Running on Port ${envs.port}`)


}
bootstrap();
