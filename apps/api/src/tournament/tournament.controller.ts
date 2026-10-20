import { BadRequestException, Body, Controller, Get, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { StageKind } from '../generated/prisma/enums.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { parseMatchInput } from './match-input.js';

function nameFrom(value: unknown): string {
  const name = (value as { name?: unknown } | null)?.name;
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
    throw new BadRequestException('Name must contain 1 to 100 characters');
  }
  return name.trim();
}

@ApiTags('Tournament admin')
@ApiCookieAuth('es_session')
@UseGuards(AuthGuard)
@Controller('admin')
export class TournamentController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('players')
  players() { return this.prisma.player.findMany({ orderBy: { name: 'asc' } }); }

  @Post('players')
  createPlayer(@Body() body: unknown) {
    return this.prisma.player.create({ data: { name: nameFrom(body) } });
  }

  @Get('teams')
  teams() { return this.prisma.team.findMany({ orderBy: { name: 'asc' } }); }

  @Post('teams')
  createTeam(@Body() body: unknown) {
    return this.prisma.team.create({ data: { name: nameFrom(body) } });
  }

  @Get('championships')
  championships() { return this.prisma.championship.findMany({ orderBy: { name: 'asc' } }); }

  @Post('championships')
  createChampionship(@Body() body: unknown) {
    return this.prisma.championship.create({ data: { name: nameFrom(body) } });
  }

  @Get('stages')
  stages() {
    return this.prisma.stage.findMany({ include: { championship: true }, orderBy: { name: 'asc' } });
  }

  @Post('stages')
  async createStage(@Body() body: { name?: unknown; kind?: unknown; championshipId?: unknown }) {
    const name = nameFrom(body);
    if (typeof body.championshipId !== 'string' || !Object.values(StageKind).includes(body.kind as StageKind)) {
      throw new BadRequestException('A championship and valid stage kind are required');
    }
    const championship = await this.prisma.championship.findUnique({ where: { id: body.championshipId } });
    if (!championship) throw new NotFoundException('Championship not found');
    return this.prisma.stage.create({ data: { name, kind: body.kind as StageKind, championshipId: body.championshipId } });
  }

  @Get('matches')
  matches() {
    return this.prisma.match.findMany({
      include: { championship: true, stage: true, homePlayer: true, awayPlayer: true, homeTeam: true, awayTeam: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('matches')
  async createMatch(@Body() body: unknown) {
    const input = parseMatchInput(body);
    const [championship, stage, homePlayer, awayPlayer, homeTeam, awayTeam] = await Promise.all([
      this.prisma.championship.findUnique({ where: { id: input.championshipId } }),
      input.stageId ? this.prisma.stage.findUnique({ where: { id: input.stageId } }) : null,
      this.prisma.player.findUnique({ where: { id: input.homePlayerId } }),
      this.prisma.player.findUnique({ where: { id: input.awayPlayerId } }),
      this.prisma.team.findUnique({ where: { id: input.homeTeamId } }),
      this.prisma.team.findUnique({ where: { id: input.awayTeamId } }),
    ]);
    if (!championship || !homePlayer || !awayPlayer || !homeTeam || !awayTeam) {
      throw new BadRequestException('Championship, players and teams must exist');
    }
    if (input.stageId && (!stage || stage.championshipId !== input.championshipId)) {
      throw new BadRequestException('Stage must belong to the championship');
    }
    return this.prisma.match.create({ data: input });
  }
}
