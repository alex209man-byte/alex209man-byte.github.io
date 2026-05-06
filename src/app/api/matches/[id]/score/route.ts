import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateStandings } from '@/lib/bracket-generator';

/**
 * PUT /api/matches/[id]/score
 * Update match score. When status becomes "completed":
 * - Auto-advance winner to next match (for elimination brackets)
 * - Update standings
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { score1, score2, status, venue, scheduledAt } = body;

    // Fetch the match with tournament data
    const match = await db.match.findUnique({
      where: { id },
      include: {
        tournament: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    if (match.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot update a completed match' },
        { status: 400 }
      );
    }

    // Validate scores
    const newScore1 = score1 !== undefined ? Number(score1) : match.score1;
    const newScore2 = score2 !== undefined ? Number(score2) : match.score2;

    if (isNaN(newScore1) || isNaN(newScore2) || newScore1 < 0 || newScore2 < 0) {
      return NextResponse.json(
        { error: 'Scores must be non-negative numbers' },
        { status: 400 }
      );
    }

    const newStatus = status ?? match.status;

    // If setting to completed, validate we have scores
    if (newStatus === 'completed' && newScore1 === 0 && newScore2 === 0) {
      return NextResponse.json(
        { error: 'Cannot complete a match with 0-0 score' },
        { status: 400 }
      );
    }

    // Update the match
    const updatedMatch = await db.match.update({
      where: { id },
      data: {
        score1: newScore1,
        score2: newScore2,
        status: newStatus,
        ...(venue !== undefined && { venue }),
        ...(scheduledAt !== undefined && { scheduledAt: scheduledAt ? new Date(scheduledAt) : null }),
        ...(newStatus === 'completed' && { completedAt: new Date() }),
      },
    });

    const results: Record<string, unknown> = {
      match: updatedMatch,
    };

    // If match is being completed, handle bracket advancement and standings
    if (newStatus === 'completed') {
      const isDraw = newScore1 === newScore2;
      const tournamentFormat = match.tournament.format;

      // Determine winner
      let winnerTeamId: string | null = null;
      let loserTeamId: string | null = null;

      if (!isDraw && match.team1Id && match.team2Id) {
        if (newScore1 > newScore2) {
          winnerTeamId = match.team1Id;
          loserTeamId = match.team2Id;
        } else {
          winnerTeamId = match.team2Id;
          loserTeamId = match.team1Id;
        }
      }

      // Auto-advance winner for elimination brackets
      if (
        (tournamentFormat === 'single_elimination' || tournamentFormat === 'double_elimination') &&
        winnerTeamId &&
        match.nextMatchId
      ) {
        const nextMatch = await db.match.findUnique({
          where: { id: match.nextMatchId },
        });

        if (nextMatch) {
          // Determine which slot the winner fills
          // We need to figure out if this match feeds into team1 or team2 of next match
          // Convention: lower position feeds into team1, higher position feeds into team2
          const isEvenPosition = match.position % 2 === 0;

          const updateData: Record<string, string | null> = {};
          if (isEvenPosition) {
            updateData.team1Id = nextMatch.team1Id || winnerTeamId;
            if (!nextMatch.team1Id) {
              updateData.team1Id = winnerTeamId;
            }
          } else {
            if (!nextMatch.team2Id) {
              updateData.team2Id = winnerTeamId;
            }
          }

          // Only update if the slot is empty
          if (Object.keys(updateData).length > 0) {
            await db.match.update({
              where: { id: match.nextMatchId },
              data: updateData,
            });

            // Check if the next match now has both teams, update status
            const refreshedNext = await db.match.findUnique({
              where: { id: match.nextMatchId },
            });

            if (
              refreshedNext &&
              refreshedNext.team1Id &&
              refreshedNext.team2Id &&
              refreshedNext.status === 'pending'
            ) {
              await db.match.update({
                where: { id: match.nextMatchId },
                data: { status: 'pending' }, // stays pending until manually started
              });
            }

            results.advancedTo = match.nextMatchId;
            results.advancedTeamId = winnerTeamId;
          }
        }
      }

      // Update standings
      if (match.team1Id && match.team2Id && match.tournament) {
        // Find or create standings entries
        const tournamentId = match.tournament.id;

        // Get team names
        const team1Data = await db.tournamentTeam.findUnique({
          where: {
            tournamentId_teamId: {
              tournamentId,
              teamId: match.team1Id,
            },
          },
          include: { team: true },
        });

        const team2Data = await db.tournamentTeam.findUnique({
          where: {
            tournamentId_teamId: {
              tournamentId,
              teamId: match.team2Id,
            },
          },
          include: { team: true },
        });

        // Update or create standing for team1
        if (team1Data) {
          const existing = await db.standing.findUnique({
            where: {
              tournamentId_teamId: {
                tournamentId,
                teamId: match.team1Id,
              },
            },
          });

          const t1Wins = newScore1 > newScore2 ? 1 : 0;
          const t1Draws = newScore1 === newScore2 ? 1 : 0;
          const t1Losses = newScore2 > newScore1 ? 1 : 0;
          const t1Points = t1Wins * match.tournament.pointsWin + t1Draws * match.tournament.pointsDraw + t1Losses * match.tournament.pointsLoss;

          if (existing) {
            await db.standing.update({
              where: { id: existing.id },
              data: {
                played: existing.played + 1,
                wins: existing.wins + t1Wins,
                draws: existing.draws + t1Draws,
                losses: existing.losses + t1Losses,
                pointsFor: existing.pointsFor + newScore1,
                pointsAgainst: existing.pointsAgainst + newScore2,
                points: existing.points + t1Points,
              },
            });
          } else {
            await db.standing.create({
              data: {
                tournamentId,
                teamId: match.team1Id,
                teamName: team1Data.team.name,
                played: 1,
                wins: t1Wins,
                draws: t1Draws,
                losses: t1Losses,
                pointsFor: newScore1,
                pointsAgainst: newScore2,
                points: t1Points,
                rank: 0,
              },
            });
          }
        }

        // Update or create standing for team2
        if (team2Data) {
          const existing = await db.standing.findUnique({
            where: {
              tournamentId_teamId: {
                tournamentId,
                teamId: match.team2Id,
              },
            },
          });

          const t2Wins = newScore2 > newScore1 ? 1 : 0;
          const t2Draws = newScore1 === newScore2 ? 1 : 0;
          const t2Losses = newScore1 > newScore2 ? 1 : 0;
          const t2Points = t2Wins * match.tournament.pointsWin + t2Draws * match.tournament.pointsDraw + t2Losses * match.tournament.pointsLoss;

          if (existing) {
            await db.standing.update({
              where: { id: existing.id },
              data: {
                played: existing.played + 1,
                wins: existing.wins + t2Wins,
                draws: existing.draws + t2Draws,
                losses: existing.losses + t2Losses,
                pointsFor: existing.pointsFor + newScore2,
                pointsAgainst: existing.pointsAgainst + newScore1,
                points: existing.points + t2Points,
              },
            });
          } else {
            await db.standing.create({
              data: {
                tournamentId,
                teamId: match.team2Id,
                teamName: team2Data.team.name,
                played: 1,
                wins: t2Wins,
                draws: t2Draws,
                losses: t2Losses,
                pointsFor: newScore2,
                pointsAgainst: newScore1,
                points: t2Points,
                rank: 0,
              },
            });
          }
        }

        // Recalculate and update ranks
        const allStandings = await db.standing.findMany({
          where: { tournamentId },
          orderBy: [
            { points: 'desc' },
            { wins: 'desc' },
          ],
        });

        // Sort by points desc, then by point difference desc
        allStandings.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const diffA = a.pointsFor - a.pointsAgainst;
          const diffB = b.pointsFor - b.pointsAgainst;
          if (diffB !== diffA) return diffB - diffA;
          return b.pointsFor - a.pointsFor;
        });

        // Update ranks
        for (let i = 0; i < allStandings.length; i++) {
          await db.standing.update({
            where: { id: allStandings[i].id },
            data: { rank: i + 1 },
          });
        }

        results.standingsUpdated = true;
      }

      // Check if tournament should auto-complete
      const completedMatches = await db.match.count({
        where: {
          tournamentId: match.tournament.id,
          status: 'completed',
        },
      });

      const totalMatches = await db.match.count({
        where: {
          tournamentId: match.tournament.id,
        },
      });

      if (completedMatches === totalMatches && match.tournament.status === 'active') {
        await db.tournament.update({
          where: { id: match.tournament.id },
          data: {
            status: 'completed',
            endDate: new Date(),
          },
        });

        results.tournamentAutoCompleted = true;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating match score:', error);
    return NextResponse.json(
      { error: 'Failed to update match score' },
      { status: 500 }
    );
  }
}
