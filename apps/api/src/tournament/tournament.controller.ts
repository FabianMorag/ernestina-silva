import { BadRequestException, Body, ConflictException, Controller, Delete, Get, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
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

  @Patch('teams/:id')
  async updateTeam(@Param('id') id: string, @Body() body: unknown) {
    const name = nameFrom(body)
    const team = await this.prisma.team.findUnique({ where: { id } })
    if (!team) throw new NotFoundException('Team not found')
    try {
      return await this.prisma.team.update({ where: { id }, data: { name } })
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'P2002')
        throw new ConflictException('Team name is already in use')
      throw error
    }
  }

  @Get('championships')
  championships() { return this.prisma.championship.findMany({ orderBy: { name: 'asc' } }); }

  @Post('championships')
  createChampionship(@Body() body: unknown) {
    const name = nameFrom(body);
    const stageKinds = (body as { stageKinds?: unknown } | null)?.stageKinds;
    if (!Array.isArray(stageKinds) || stageKinds.length === 0 ||
      stageKinds.some((kind) => !Object.values(StageKind).includes(kind as StageKind)) ||
      new Set(stageKinds).size !== stageKinds.length) {
      throw new BadRequestException('Select one or more distinct stage kinds');
    }
    return this.prisma.championship.create({ data: {
      name,
      stages: { create: stageKinds.map((kind) => ({ kind: kind as StageKind })) },
    } });
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
    return this.prisma.stage.findMany({ include: { championship: true }, orderBy: { kind: 'asc' } });
  }

  @Get('groups')
  groups() {
    return this.prisma.stageGroup.findMany({ orderBy: { name: 'asc' } });
  }

  @Post('groups')
  async createStageGroup(@Body() body: { stageId?: unknown; name?: unknown }) {
    if (typeof body?.stageId !== 'string' || !body.stageId ||
      typeof body?.name !== 'string' || !body.name.trim() || body.name.trim().length > 30) {
      throw new BadRequestException('A stage and group name of 1 to 30 characters are required');
    }
    const stage = await this.prisma.stage.findUnique({ where: { id: body.stageId } });
    if (!stage || stage.kind !== StageKind.GROUP) {
      throw new BadRequestException('Groups require a group stage');
    }
    try {
      return await this.prisma.stageGroup.create({ data: { stageId: body.stageId, name: body.name.trim() } });
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'P2002') throw new ConflictException('Group name already exists in stage');
      throw error;
    }
  }

  @Post('stages')
  async createStage(@Body() body: { kind?: unknown; championshipId?: unknown }) {
    if (typeof body?.championshipId !== 'string' || !Object.values(StageKind).includes(body.kind as StageKind)) {
      throw new BadRequestException('A championship and valid stage kind are required');
    }
    const championship = await this.prisma.championship.findUnique({ where: { id: body.championshipId } });
    if (!championship) throw new NotFoundException('Championship not found');
    try {
      return await this.prisma.stage.create({ data: { kind: body.kind as StageKind, championshipId: body.championshipId } });
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'P2002') throw new ConflictException('Stage kind already exists in championship');
      throw error;
    }
  }

  @Delete('stages/:id')
  async deleteStage(@Param('id') id: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const stage = await tx.stage.findUnique({ where: { id }, select: { id: true } });
        if (!stage) throw new NotFoundException('Stage not found');
        const stageMatches = await tx.match.updateMany({
          where: { stageId: id },
          data: { stageId: null, groupId: null },
        });
        const groupMatches = await tx.match.updateMany({
          where: { group: { stageId: id } },
          data: { groupId: null },
        });
        await tx.stage.delete({ where: { id } });
        return { deleted: true, detachedMatches: stageMatches.count + groupMatches.count };
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      if ((error as { code?: unknown })?.code === 'P2025') throw new NotFoundException('Stage not found');
      if ((error as { code?: unknown })?.code === 'P2003') {
        throw new ConflictException('Stage changed concurrently; retry deletion');
      }
      rethrowTransactionConflict(error);
    }
  }

  @Get('matches')
  matches() {
    return this.prisma.match.findMany({
      include: { championship: true, stage: true, group: true, homePlayer: true, awayPlayer: true, homeTeam: true, awayTeam: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Delete('matches/:id')
  async deleteMatch(@Param('id') id: string) {
    const { count } = await this.prisma.match.deleteMany({ where: { id } })
    if (count === 0) throw new NotFoundException('Match not found')
    return { deleted: true }
  }

  @Patch('matches/:id')
  async updateMatch(@Param('id') id: string, @Body() body: unknown) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestException('Stage and scores are required');
    }
    const input = body as Record<string, unknown>;
    const allowed = ['stageId', 'groupId', 'homeScore', 'awayScore'];
    if (Object.keys(input).some((key) => !allowed.includes(key)) ||
      !['stageId', 'homeScore', 'awayScore'].every((key) => key in input)) {
      throw new BadRequestException('Only stage, group and scores can be edited');
    }
    if (input.stageId !== null && (typeof input.stageId !== 'string' || !input.stageId)) {
      throw new BadRequestException('stageId must be an identifier or null');
    }
    if (input.groupId != null && (typeof input.groupId !== 'string' || !input.groupId)) {
      throw new BadRequestException('groupId must be an identifier or null');
    }
    for (const key of ['homeScore', 'awayScore'] as const) {
      if (!Number.isInteger(input[key]) || (input[key] as number) < 0) {
        throw new BadRequestException(`${key} must be a non-negative integer`);
      }
    }
    const match = await this.prisma.match.findUnique({ where: { id }, select: { championshipId: true, stageId: true, groupId: true } });
    if (!match) throw new NotFoundException('Match not found');
    let stage = null;
    if (input.stageId !== null) {
      stage = await this.prisma.stage.findUnique({ where: { id: input.stageId as string } });
      if (!stage || stage.championshipId !== match.championshipId) {
        throw new BadRequestException('Stage must belong to the championship');
      }
    }
    const groupId = 'groupId' in input
      ? input.groupId as string | null
      : match.stageId === input.stageId ? match.groupId : null;
    if (groupId) {
      const group = await this.prisma.stageGroup.findUnique({ where: { id: groupId } });
      if (!stage || stage.kind !== StageKind.GROUP || group?.stageId !== stage.id) {
        throw new BadRequestException('Group must belong to the selected group stage');
      }
    } else if (stage?.kind === StageKind.GROUP && ('groupId' in input || match.stageId !== stage.id)) {
      throw new BadRequestException('A group is required for a group-stage match');
    }
    const { count } = await this.prisma.match.updateMany({
      where: { id },
      data: {
        stageId: input.stageId as string | null,
        groupId,
        homeScore: input.homeScore as number,
        awayScore: input.awayScore as number,
      },
    });
    if (count === 0) throw new NotFoundException('Match not found');
    return { updated: true };
  }

  @Post('matches')
  async createMatch(@Body() body: unknown) {
    const input = parseMatchInput(body);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const [championship, stage, group, homePlayer, awayPlayer, homeTeam, awayTeam] = await Promise.all([
          tx.championship.findUnique({ where: { id: input.championshipId } }),
          input.stageId ? tx.stage.findUnique({ where: { id: input.stageId } }) : null,
          input.groupId ? tx.stageGroup.findUnique({ where: { id: input.groupId } }) : null,
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
        if (stage?.kind === StageKind.GROUP && !input.groupId) {
          throw new BadRequestException('A group is required for a group-stage match');
        }
        if (input.groupId && (!stage || stage.kind !== StageKind.GROUP || group?.stageId !== stage.id)) {
          throw new BadRequestException('Group must belong to the selected group stage');
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
