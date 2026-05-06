import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * DELETE /api/tournaments/[id]/teams/[teamId]/players/[playerId]
 * Remove a player from a tournament team
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string; playerId: string }> }
) {
  try {
    const { id, teamId, playerId } = await params;

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

    // Check player exists and belongs to this tournament team
    const player = await db.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    if (player.tournamentTeamId !== tournamentTeam.id) {
      return NextResponse.json(
        { error: 'Player does not belong to this team in this tournament' },
        { status: 403 }
      );
    }

    await db.player.delete({
      where: { id: playerId },
    });

    return NextResponse.json({
      message: 'Player removed successfully',
    });
  } catch (error) {
    console.error('Error removing player:', error);
    return NextResponse.json(
      { error: 'Failed to remove player' },
      { status: 500 }
    );
  }
}
