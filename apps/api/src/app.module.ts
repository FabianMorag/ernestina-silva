import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { HealthController } from './health.controller.js';
import { PrismaService } from './prisma/prisma.service.js';
import { AuthController } from './auth/auth.controller.js';
import { AuthGuard } from './auth/auth.guard.js';
import { AuthService } from './auth/auth.service.js';
import { TournamentController } from './tournament/tournament.controller.js';
import { PublicTournamentController } from './tournament/public-tournament.controller.js';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [AppController, HealthController, AuthController, TournamentController, PublicTournamentController],
  providers: [AppService, PrismaService, AuthService, AuthGuard],
})
export class AppModule {}
