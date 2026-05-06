import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/tournaments/[id]
 * Get tournament with full details (teams, matches, standings)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            team: true,
            players: true,
          },
          orderBy: { seed: 'asc' },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { position: 'asc' }],
        },
        standings: {
          orderBy: { rank: 'asc' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/tournaments/[id]
 * Update tournament settings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check tournament exists
    const existing = await db.tournament.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Cannot update active/completed tournaments
    if (existing.status === 'active' || existing.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot modify an active or completed tournament' },
        { status: 400 }
      );
    }

    const {
      name,
      description,
      sport,
      format,
      maxTeams,
      winsNeeded,
      pointsWin,
      pointsDraw,
      pointsLoss,
      startDate,
      endDate,
      status,
      coverColor,
    } = body;

    const tournament = await db.tournament.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(sport !== undefined && { sport }),
        ...(format !== undefined && { format }),
        ...(maxTeams !== undefined && { maxTeams }),
        ...(winsNeeded !== undefined && { winsNeeded }),
        ...(pointsWin !== undefined && { pointsWin }),
        ...(pointsDraw !== undefined && { pointsDraw }),
        ...(pointsLoss !== undefined && { pointsLoss }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(status !== undefined && { status }),
        ...(coverColor !== undefined && { coverColor }),
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error updating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tournaments/[id]
 * Delete a tournament and all associated data
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check tournament exists
    const existing = await db.tournament.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Cannot delete active tournaments
    if (existing.status === 'active') {
      return NextResponse.json(
        { error: 'Cannot delete an active tournament. Complete it first.' },
        { status: 400 }
      );
    }

    await db.tournament.delete({ where: { id } });

    return NextResponse.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}
