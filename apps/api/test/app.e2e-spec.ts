import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './../src/app.module.js';
import { setupSwagger } from './../src/swagger.js';
import { PrismaService } from './../src/prisma/prisma.service.js';
import { AuthService } from './../src/auth/auth.service.js';

describe('AppController (e2e)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: async () => [{ ok: 1 }],
        player: { findMany: async () => [] },
        team: { findMany: async () => [] },
        championship: { findMany: async () => [] },
        stage: { findMany: async () => [] },
        match: { findMany: async () => [] },
      })
      .overrideProvider(AuthService)
      .useValue({
        login: async () => ({ username: 'admin', token: 'test-token' }),
        currentUser: async (token?: string) => token === 'test-token' ? { username: 'admin' } : null,
        logout: async () => undefined,
      })
      .compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    setupSwagger(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it('/ (GET)', async () => {
    expect(app.getHttpAdapter().getType()).toBe('fastify');
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Hello World!');
  });

  it('/docs-json (GET)', async () => {
    const response = await app.inject({ method: 'GET', url: '/docs-json' });
    expect(response.statusCode).toBe(200);
    const document = response.json();
    expect(document.paths).toHaveProperty('/');
    const loginSchema = document.paths['/auth/login'].post.requestBody.content['application/json'].schema;
    expect(loginSchema.required).toEqual(expect.arrayContaining(['username', 'password']));
    expect(loginSchema.properties.username.type).toBe('string');
    expect(loginSchema.properties.password).toMatchObject({ type: 'string', format: 'password' });
    expect(document.components.securitySchemes.es_session).toMatchObject({
      type: 'apiKey',
      in: 'cookie',
      name: 'es_session',
    });
    expect(document.paths['/admin/players'].get.security).toContainEqual({ es_session: [] });
    expect(document.paths['/tournament/players'].get.security).toBeUndefined();
    expect(document.paths['/admin/players'].post.security).toContainEqual({ es_session: [] });
  });

  it('/health/database (GET)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health/database',
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });

  it('protects the admin API with a session cookie', async () => {
    const denied = await app.inject({ method: 'GET', url: '/admin/players' });
    expect(denied.statusCode).toBe(401);

    const login = await app.inject({ method: 'POST', url: '/auth/login', payload: { username: 'admin', password: 'admin' } });
    expect(login.statusCode).toBe(201);
    expect(login.headers['set-cookie']).toContain('HttpOnly');

    const allowed = await app.inject({ method: 'GET', url: '/admin/players', headers: { cookie: 'es_session=test-token' } });
    expect(allowed.statusCode).toBe(200);
    expect(allowed.json()).toEqual([]);
  });

  it('allows anonymous tournament reads but rejects anonymous writes', async () => {
    for (const resource of ['players', 'teams', 'championships', 'stages', 'matches']) {
      const response = await app.inject({ method: 'GET', url: `/tournament/${resource}` });
      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual([]);
    }
    const denied = await app.inject({ method: 'POST', url: '/admin/players', payload: { name: 'Player' } });
    expect(denied.statusCode).toBe(401);
    const deniedEdit = await app.inject({ method: 'PATCH', url: '/admin/players/player', payload: { name: 'Edited' } });
    expect(deniedEdit.statusCode).toBe(401);
    const deniedAssignment = await app.inject({ method: 'POST', url: '/admin/participants', payload: { championshipId: 'championship', playerId: 'player', teamId: 'team' } });
    expect(deniedAssignment.statusCode).toBe(401);
  });

  afterEach(async () => {
    await app.close();
  });
});
