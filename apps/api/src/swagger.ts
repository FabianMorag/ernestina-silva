import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

export function setupSwagger(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Ernestina Silva API')
    .setVersion('1.0.0')
    .addCookieAuth(
      'es_session',
      {
        type: 'apiKey',
        description: 'Sign in with POST /auth/login in this browser. The session cookie is managed automatically.',
      },
      'es_session',
    )
    .build();

  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
}
