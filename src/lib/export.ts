/**
 * CSV Export utility for tournament data
 */

export interface CsvRow {
  [key: string]: string | number | null | undefined;
}

/**
 * Convert an array of objects to CSV string
 */
export function toCsv(data: CsvRow[], headers?: string[]): string {
  if (data.length === 0) return '';

  const allHeaders = headers ?? Object.keys(data[0]);
  const headerRow = allHeaders.map(escapeCsvField).join(',');

  const rows = data.map(row =>
    allHeaders.map(header => {
      const value = row[header];
      return escapeCsvField(value);
    }).join(',')
  );

  return [headerRow, ...rows].join('\n');
}

/**
 * Escape a value for CSV format
 */
function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // If the value contains a comma, newline, or quote, wrap in quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generate a CSV filename with timestamp
 */
export function generateCsvFilename(prefix: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `${prefix}_${timestamp}.csv`;
}

/**
 * Export tournament summary as CSV rows
 */
export function tournamentToCsvRows(tournament: {
  id: string;
  name: string;
  description: string | null;
  sport: string;
  format: string;
  maxTeams: number;
  winsNeeded: number;
  startDate: Date | null;
  endDate: Date | null;
  status: string;
  createdAt: Date;
}): CsvRow[] {
  return [{
    'Tournament ID': tournament.id,
    'Name': tournament.name,
    'Description': tournament.description ?? '',
    'Sport': tournament.sport,
    'Format': tournament.format,
    'Max Teams': tournament.maxTeams,
    'Wins Needed': tournament.winsNeeded,
    'Start Date': tournament.startDate?.toISOString() ?? '',
    'End Date': tournament.endDate?.toISOString() ?? '',
    'Status': tournament.status,
    'Created At': tournament.createdAt.toISOString(),
  }];
}

/**
 * Export teams as CSV rows
 */
export function teamsToCsvRows(teams: {
  teamId: string;
  teamName: string;
  teamTag: string | null;
  seed: number;
  players: { name: string; role: string }[];
}[]): CsvRow[] {
  return teams.map(t => ({
    'Team ID': t.teamId,
    'Team Name': t.teamName,
    'Team Tag': t.teamTag ?? '',
    'Seed': t.seed,
    'Players': t.players.map(p => `${p.name} (${p.role})`).join('; '),
  }));
}

/**
 * Export matches as CSV rows
 */
export function matchesToCsvRows(matches: {
  id: string;
  round: number;
  position: number;
  team1Id: string | null;
  team2Id: string | null;
  team1Name: string | null;
  team2Name: string | null;
  score1: number;
  score2: number;
  status: string;
  bracket: string;
  scheduledAt: Date | null;
  completedAt: Date | null;
  venue: string | null;
}[]): CsvRow[] {
  return matches.map(m => ({
    'Match ID': m.id,
    'Round': m.round,
    'Position': m.position,
    'Bracket': m.bracket,
    'Team 1': m.team1Name ?? 'TBD',
    'Team 2': m.team2Name ?? 'TBD',
    'Score 1': m.score1,
    'Score 2': m.score2,
    'Status': m.status,
    'Scheduled At': m.scheduledAt?.toISOString() ?? '',
    'Completed At': m.completedAt?.toISOString() ?? '',
    'Venue': m.venue ?? '',
  }));
}

/**
 * Export standings as CSV rows
 */
export function standingsToCsvRows(standings: {
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
  rank: number;
}[]): CsvRow[] {
  return standings.map(s => ({
    'Rank': s.rank,
    'Team': s.teamName,
    'Played': s.played,
    'Wins': s.wins,
    'Draws': s.draws,
    'Losses': s.losses,
    'Points For': s.pointsFor,
    'Points Against': s.pointsAgainst,
    'Point Difference': s.pointsFor - s.pointsAgainst,
    'Points': s.points,
  }));
}
