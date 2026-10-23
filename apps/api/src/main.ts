import { NestFactory } from '@nestjs/core'
import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { AppModule } from './app.module.js'
import { setupSwagger } from './swagger.js'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )
  if (process.env.VERCEL === '1') {
    await app.init()
    const instance = app.getHttpAdapter().getInstance()
    await instance.ready()
    const server = instance.server
    return (request: IncomingMessage, response: ServerResponse) => {
      server.emit('request', request, response)
    }
  }

  setupSwagger(app)
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0')
}

export default await bootstrap()
