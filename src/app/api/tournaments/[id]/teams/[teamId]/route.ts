import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * DELETE /api/tournaments/[id]/teams/[teamId]
 * Remove a team from a tournament
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; teamId: string }> }
) {
  try {
    const { id, teamId } = await params;

    // Check tournament exists
    const tournament = await db.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'draft' && tournament.status !== 'registration') {
      return NextResponse.json(
        { error: 'Teams can only be removed during draft or registration phase' },
        { status: 400 }
      );
    }

    // Check if team is in the tournament
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

    // Delete the tournament team entry (cascades to players)
    await db.tournamentTeam.delete({
      where: {
        tournamentId_teamId: {
          tournamentId: id,
          teamId,
        },
      },
    });

    return NextResponse.json({
      message: 'Team removed from tournament successfully',
    });
  } catch (error) {
    console.error('Error removing team from tournament:', error);
    return NextResponse.json(
      { error: 'Failed to remove team from tournament' },
      { status: 500 }
    );
  }
}
