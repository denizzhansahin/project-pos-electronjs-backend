import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;
  app.enableCors({
    origin: '*',
    allowedHeaders: '*',
    methods: '*', // Tüm HTTP metodları
    credentials: true,
  });
  await app.listen(port, '0.0.0.0'); // <<< BURAYI GÜNCELLE
  console.log(process.env.dbName)
  console.log(process.env.url)
}
bootstrap();



/*

  app.useGlobalPipes(new ValidationPipe({
    whitelist:true,
    forbidNonWhitelisted:true
  }))//global olarak tanımla, yerelde özel olarak yapmana gerek kalmaz
*/