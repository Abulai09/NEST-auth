import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //SWAGGER
  const config = new DocumentBuilder()
    .setTitle('AUTH CRUD')
    .setDescription('Documentation of CRUD OPERATION')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  //validator
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  //CORS
  app.enableCors({
    origin: process.env.CORS,
    credentials: true,
  });

  const port = process.env.PORT;
  await app.listen(port ?? 3000);
  console.log(`server runing in ${port} port`);
  console.log(`server runing in http://localhost:${port}`);
  console.log(`SWAGGER: http://localhost:${port}/api/docs`);
}
bootstrap();
