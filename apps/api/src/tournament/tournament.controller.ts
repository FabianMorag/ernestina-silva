import { BadRequestException, Body, ConflictException, Controller, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

function titleFrom(value: unknown): string | null {
  const title = (value as { title?: unknown } | null)?.title;
  if (title === undefined || title === null || title === '') return null;
  if (typeof title !== 'string' || title.trim().length > 100) throw new BadRequestException('Title must contain at most 100 characters');
  return title.trim() || null;
}

function rethrowTransactionConflict(error: unknown): never {
  if ((error as { code?: unknown })?.code === 'P2034') {
    throw new ConflictException('Championship data changed concurrently; retry the request');
  }
  throw error;
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
    return this.prisma.player.create({ data: { name: nameFrom(body), title: titleFrom(body) } });
  }

  @Patch('players/:id')
  async updatePlayer(@Param('id') id: string, @Body() body: unknown) {
    const player = await this.prisma.player.findUnique({ where: { id } });
    if (!player) throw new NotFoundException('Player not found');
    try {
      return await this.prisma.player.update({ where: { id }, data: { name: nameFrom(body), title: titleFrom(body) } });
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'P2002') throw new ConflictException('Player name is already in use');
      throw error;
    }
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

  @Get('participants')
  participants() {
    return this.prisma.championshipParticipant.findMany({ include: { player: true, team: true }, orderBy: { player: { name: 'asc' } } });
  }

  @Post('participants')
  async assignParticipant(@Body() body: { championshipId?: unknown; playerId?: unknown; teamId?: unknown }) {
    if (typeof body?.championshipId !== 'string' || typeof body.playerId !== 'string' || typeof body.teamId !== 'string') {
      throw new BadRequestException('Championship, player and team are required');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [championship, player, team] = await Promise.all([
          tx.championship.findUnique({ where: { id: body.championshipId as string } }),
          tx.player.findUnique({ where: { id: body.playerId as string } }),
          tx.team.findUnique({ where: { id: body.teamId as string } }),
        ]);
        if (!championship || !player || !team) throw new BadRequestException('Championship, player and team must exist');
        const current = await tx.championshipParticipant.findUnique({
          where: { championshipId_playerId: { championshipId: body.championshipId as string, playerId: body.playerId as string } },
        });
        if (!current || current.teamId !== body.teamId) {
          const conflictingMatch = await tx.match.findFirst({ where: {
            championshipId: body.championshipId as string,
            OR: [
              { homePlayerId: body.playerId as string, homeTeamId: { not: body.teamId as string } },
              { awayPlayerId: body.playerId as string, awayTeamId: { not: body.teamId as string } },
            ],
          } });
          if (conflictingMatch) throw new BadRequestException('Assigned team must match existing championship matches');
        }
        return tx.championshipParticipant.upsert({
          where: { championshipId_playerId: { championshipId: body.championshipId as string, playerId: body.playerId as string } },
          create: { championshipId: body.championshipId as string, playerId: body.playerId as string, teamId: body.teamId as string },
          update: { teamId: body.teamId as string },
        });
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      rethrowTransactionConflict(error);
    }
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
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [championship, stage, homePlayer, awayPlayer, homeTeam, awayTeam] = await Promise.all([
          tx.championship.findUnique({ where: { id: input.championshipId } }),
          input.stageId ? tx.stage.findUnique({ where: { id: input.stageId } }) : null,
          tx.player.findUnique({ where: { id: input.homePlayerId } }),
          tx.player.findUnique({ where: { id: input.awayPlayerId } }),
          tx.team.findUnique({ where: { id: input.homeTeamId } }),
          tx.team.findUnique({ where: { id: input.awayTeamId } }),
        ]);
        if (!championship || !homePlayer || !awayPlayer || !homeTeam || !awayTeam) {
          throw new BadRequestException('Championship, players and teams must exist');
        }
        if (input.stageId && (!stage || stage.championshipId !== input.championshipId)) {
          throw new BadRequestException('Stage must belong to the championship');
        }
        const [homeAssignment, awayAssignment] = await Promise.all([
          tx.championshipParticipant.findUnique({ where: { championshipId_playerId: { championshipId: input.championshipId, playerId: input.homePlayerId } } }),
          tx.championshipParticipant.findUnique({ where: { championshipId_playerId: { championshipId: input.championshipId, playerId: input.awayPlayerId } } }),
        ]);
        if (homeAssignment?.teamId !== input.homeTeamId || awayAssignment?.teamId !== input.awayTeamId) {
          throw new BadRequestException('Teams must match each player’s championship assignment');
        }
        return tx.match.create({ data: input });
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      rethrowTransactionConflict(error);
    }
  }
}
