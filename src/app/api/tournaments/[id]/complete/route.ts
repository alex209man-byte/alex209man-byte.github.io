import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/tournaments/[id]/complete
 * Set tournament status to completed
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id },
      include: {
        standings: {
          orderBy: { rank: 'asc' },
        },
        matches: {
          where: { status: 'completed' },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    if (tournament.status !== 'active') {
      return NextResponse.json(
        { error: 'Only active tournaments can be completed' },
        { status: 400 }
      );
    }

    // Update tournament status
    const updated = await db.tournament.update({
      where: { id },
      data: {
        status: 'completed',
        endDate: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Tournament completed successfully',
      tournament: updated,
    });
  } catch (error) {
    console.error('Error completing tournament:', error);
    return NextResponse.json(
      { error: 'Failed to complete tournament' },
      { status: 500 }
    );
  }
}
