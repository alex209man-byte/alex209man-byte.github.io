import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  generateBracket,
  calculateStandings,
  type SeedTeam,
} from '@/lib/bracket-generator';

/**
 * POST /api/tournaments/[id]/start
 * Generate brackets and change status to "active"
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch tournament with teams
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: true,
          },
          orderBy: { seed: 'asc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'Tournament must be in registration status to start' },
        { status: 400 }
      );
    }

    if (tournament.teams.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to start the tournament' },
        { status: 400 }
      );
    }

    // Check if matches already exist
    const existingMatches = await db.match.count({
      where: { tournamentId: id },
    });
    if (existingMatches > 0) {
      return NextResponse.json(
        { error: 'Brackets have already been generated' },
        { status: 400 }
      );
    }

    // Prepare seed teams
    const seedTeams: SeedTeam[] = tournament.teams.map((tt, index) => ({
      id: tt.id,
      teamId: tt.teamId,
      seed: tt.seed || index + 1,
      name: tt.team.name,
    }));

    // Sort by seed
    seedTeams.sort((a, b) => a.seed - b.seed);
    // Re-number seeds to be consecutive
    seedTeams.forEach((team, index) => {
      team.seed = index + 1;
    });

    // Generate bracket matches
    const bracketMatches = generateBracket(tournament.format, seedTeams);

    if (bracketMatches.length === 0) {
      return NextResponse.json(
        { error: 'Could not generate bracket with the current teams' },
        { status: 400 }
      );
    }

    // Create matches in database
    const matchIds: string[] = [];
    const matchIdMap = new Map<string, string>(); // key -> db match id

    for (const match of bracketMatches) {
      // Generate a key for this match position
      const matchKey = `${match.bracket}_round${match.round}_pos${match.position}`;

      const created = await db.match.create({
        data: {
          tournamentId: id,
          round: match.round,
          position: match.position,
          team1Id: match.team1Id,
          team2Id: match.team2Id,
          score1: 0,
          score2: 0,
          status: 'pending',
          bracket: match.bracket,
          // nextMatchId will be linked after all matches are created
        },
      });

      matchIds.push(created.id);
      matchIdMap.set(matchKey, created.id);
    }

    // Link nextMatchId for elimination brackets
    if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
      for (const match of bracketMatches) {
        if (match.nextMatchId && matchIdMap.has(match.nextMatchId)) {
          const currentKey = `${match.bracket}_round${match.round}_pos${match.position}`;
          const currentMatchId = matchIdMap.get(currentKey);
          const nextMatchId = matchIdMap.get(match.nextMatchId);

          if (currentMatchId && nextMatchId) {
            await db.match.update({
              where: { id: currentMatchId },
              data: { nextMatchId },
            });
          }
        }
      }
    }

    // Initialize standings for all teams
    // For round robin, standings are always relevant
    // For elimination, we still track basic stats
    if (tournament.format === 'round_robin') {
      for (const team of seedTeams) {
        await db.standing.create({
          data: {
            tournamentId: id,
            teamId: team.teamId,
            teamName: team.name ?? '',
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            points: 0,
            rank: team.seed,
          },
        });
      }
    } else {
      // For elimination brackets, also create standings
      for (const team of seedTeams) {
        await db.standing.create({
          data: {
            tournamentId: id,
            teamId: team.teamId,
            teamName: team.name ?? '',
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            pointsFor: 0,
            pointsAgainst: 0,
            points: 0,
            rank: team.seed,
          },
        });
      }
    }

    // Update tournament status
    const updatedTournament = await db.tournament.update({
      where: { id },
      data: {
        status: 'active',
        startDate: tournament.startDate ?? new Date(),
      },
    });

    // Fetch created matches for response
    const createdMatches = await db.match.findMany({
      where: { tournamentId: id },
      orderBy: [{ round: 'asc' }, { position: 'asc' }],
    });

    return NextResponse.json({
      message: 'Tournament started successfully',
      tournament: updatedTournament,
      matches: createdMatches,
      totalMatches: createdMatches.length,
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    return NextResponse.json(
      { error: 'Failed to start tournament' },
      { status: 500 }
    );
  }
}
