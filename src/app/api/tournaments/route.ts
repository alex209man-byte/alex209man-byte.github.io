import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/tournaments
 * List all tournaments with team count and match count
 */
export async function GET() {
  try {
    const tournaments = await db.tournament.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            teams: true,
            matches: true,
          },
        },
      },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tournaments
 * Create a new tournament
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Tournament name is required' },
        { status: 400 }
      );
    }

    const tournament = await db.tournament.create({
      data: {
        name: name.trim(),
        description: description ?? null,
        sport: sport ?? 'General',
        format: format ?? 'single_elimination',
        maxTeams: maxTeams ?? 8,
        winsNeeded: winsNeeded ?? 1,
        pointsWin: pointsWin ?? 3,
        pointsDraw: pointsDraw ?? 1,
        pointsLoss: pointsLoss ?? 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: status ?? 'draft',
        coverColor: coverColor ?? '#10b981',
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}
