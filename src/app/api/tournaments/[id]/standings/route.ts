import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/tournaments/[id]/standings
 * Get current standings for a tournament
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await db.tournament.findUnique({
      where: { id },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    const standings = await db.standing.findMany({
      where: { tournamentId: id },
      orderBy: [
        { rank: 'asc' },
        { points: 'desc' },
      ],
    });

    // If no standings exist yet, create them from tournament teams
    if (standings.length === 0) {
      const tournamentTeams = await db.tournamentTeam.findMany({
        where: { tournamentId: id },
        include: { team: true },
        orderBy: { seed: 'asc' },
      });

      if (tournamentTeams.length > 0) {
        const createdStandings = [];
        for (let i = 0; i < tournamentTeams.length; i++) {
          const standing = await db.standing.create({
            data: {
              tournamentId: id,
              teamId: tournamentTeams[i].teamId,
              teamName: tournamentTeams[i].team.name,
              played: 0,
              wins: 0,
              draws: 0,
              losses: 0,
              pointsFor: 0,
              pointsAgainst: 0,
              points: 0,
              rank: i + 1,
            },
          });
          createdStandings.push(standing);
        }

        return NextResponse.json({
          tournamentId: id,
          tournamentName: tournament.name,
          format: tournament.format,
          standings: createdStandings,
        });
      }
    }

    return NextResponse.json({
      tournamentId: id,
      tournamentName: tournament.name,
      format: tournament.format,
      standings,
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: 500 }
    );
  }
}
