import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/tournaments/[id]/teams/[teamId]/players
 * Add a player to a tournament team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id, teamId } = await params;
    const body = await request.json();

    const { name, role } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    // Check tournament exists
    const tournament = await db.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Check team is in the tournament
    const tournamentTeam = await db.tournamentTeam.findUnique({
      where: {
        tournamentId_teamId: {
          tournamentId: id,
          teamId,
        },
      },
    });

    if (!tournamentTeam) {
      return NextResponse.json(
        { error: 'Team is not in this tournament' },
        { status: 404 }
      );
    }

    const player = await db.player.create({
      data: {
        name: name.trim(),
        role: role ?? 'Player',
        tournamentTeamId: tournamentTeam.id,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error adding player:', error);
    return NextResponse.json(
      { error: 'Failed to add player' },
      { status: 500 }
    );
  }
}
