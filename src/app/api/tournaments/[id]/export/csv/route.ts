import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { toCsv, generateCsvFilename } from '@/lib/export';

/**
 * GET /api/tournaments/[id]/export/csv
 * Export tournament data as CSV
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

    // Build team name map for match display
    const teamNameMap = new Map<string, string>();
    for (const tt of tournament.teams) {
      teamNameMap.set(tt.teamId, tt.team.name);
    }

    // Generate CSV sections
    const sections: string[] = [];

    // Tournament Info
    const tournamentInfo = toCsv([{
      'Tournament ID': tournament.id,
      'Name': tournament.name,
      'Description': tournament.description ?? '',
      'Sport': tournament.sport,
      'Format': tournament.format,
      'Max Teams': tournament.maxTeams,
      'Wins Needed': tournament.winsNeeded,
      'Points (Win/Draw/Loss)': `${tournament.pointsWin}/${tournament.pointsDraw}/${tournament.pointsLoss}`,
      'Start Date': tournament.startDate?.toISOString().split('T')[0] ?? '',
      'End Date': tournament.endDate?.toISOString().split('T')[0] ?? '',
      'Status': tournament.status,
      'Created At': tournament.createdAt.toISOString(),
    }]);
    sections.push('=== TOURNAMENT INFO ===\n' + tournamentInfo);

    // Teams
    const teamsCsv = toCsv(
      tournament.teams.map(tt => ({
        'Seed': tt.seed,
        'Team Name': tt.team.name,
        'Tag': tt.team.tag ?? '',
        'Description': tt.team.description ?? '',
        'Players': tt.players.map(p => `${p.name} (${p.role})`).join('; '),
      }))
    );
    sections.push('\n=== TEAMS ===\n' + teamsCsv);

    // Matches
    const matchesCsv = toCsv(
      tournament.matches.map(m => ({
        'Match ID': m.id,
        'Round': m.round,
        'Position': m.position,
        'Bracket': m.bracket,
        'Team 1': teamNameMap.get(m.team1Id ?? '') ?? 'TBD',
        'Team 2': teamNameMap.get(m.team2Id ?? '') ?? 'TBD',
        'Score': m.status === 'completed' ? `${m.score1} - ${m.score2}` : '-',
        'Status': m.status,
        'Scheduled': m.scheduledAt?.toISOString().split('T')[0] ?? '',
        'Completed': m.completedAt?.toISOString().split('T')[0] ?? '',
        'Venue': m.venue ?? '',
      }))
    );
    sections.push('\n=== MATCHES ===\n' + matchesCsv);

    // Standings
    if (tournament.standings.length > 0) {
      const standingsCsv = toCsv(
        tournament.standings.map(s => ({
          'Rank': s.rank,
          'Team': s.teamName,
          'Played': s.played,
          'Wins': s.wins,
          'Draws': s.draws,
          'Losses': s.losses,
          'Points For': s.pointsFor,
          'Points Against': s.pointsAgainst,
          'Difference': s.pointsFor - s.pointsAgainst,
          'Points': s.points,
        }))
      );
      sections.push('\n=== STANDINGS ===\n' + standingsCsv);
    }

    const csvContent = sections.join('\n');
    const filename = generateCsvFilename(tournament.name.replace(/[^a-zA-Z0-9]/g, '_'));

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting tournament CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export tournament data' },
      { status: 500 }
    );
  }
}
