import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const port = process.env.PORT ?? 3000;

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  await app.listen(port ?? 3000);
  console.log(`server on ${port} port`);
  console.log(`server running at http://localhost:${port}`);
}
bootstrap();
