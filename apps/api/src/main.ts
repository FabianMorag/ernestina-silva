import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  setupSwagger(app);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
await bootstrap();
