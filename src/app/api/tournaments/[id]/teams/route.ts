import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/tournaments/[id]/teams
 * Add a team to a tournament
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { teamId, seed } = body;

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    // Check tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        teams: true,
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'draft' && tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'Teams can only be added during draft or registration phase' },
        { status: 400 }
      );
    }

    // Check team exists
    const team = await db.team.findUnique({ where: { id: teamId } });
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Check if team is already in the tournament
    const existingEntry = await db.tournamentTeam.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId: id,
          teamId,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: 'Team is already in this tournament' },
        { status: 409 }
      );
    }

    // Check max teams
    if (tournament.teams.length >= tournament.maxTeams) {
      return NextResponse.json(
        { error: `Tournament has reached maximum capacity of ${tournament.maxTeams} teams` },
        { status: 400 }
      );
    }

    // Determine seed
    const teamSeed = seed ?? tournament.teams.length + 1;

    // If no teamId provided, create a new team
    let finalTeamId = teamId;
    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    const tournamentTeam = await db.tournamentTeam.create({
      data: {
        tournamentId: id,
        teamId: finalTeamId,
        seed: teamSeed,
      },
      include: {
        team: true,
        players: true,
      },
    });

    return NextResponse.json(tournamentTeam, { status: 201 });
  } catch (error) {
    console.error('Error adding team to tournament:', error);
    return NextResponse.json(
      { error: 'Failed to add team to tournament' },
      { status: 500 }
    );
  }
}
