import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Tournament')
@Controller('tournament')
export class PublicTournamentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('players')
  players() { return this.prisma.player.findMany({ orderBy: { name: 'asc' } }); }

  @Get('teams')
  teams() { return this.prisma.team.findMany({ orderBy: { name: 'asc' } }); }

  @Get('championships')
  championships() { return this.prisma.championship.findMany({ orderBy: { name: 'asc' } }); }

  @Get('stages')
  stages() {
    return this.prisma.stage.findMany({ include: { championship: true }, orderBy: { kind: 'asc' } });
  }

  @Get('matches')
  matches() {
    return this.prisma.match.findMany({
      include: { championship: true, stage: true, homePlayer: true, awayPlayer: true, homeTeam: true, awayTeam: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
