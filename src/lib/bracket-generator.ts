/**
 * Bracket Generator - Creates tournament brackets for different formats
 */

export interface SeedTeam {
  id: string;
  teamId: string;
  seed: number;
  name?: string;
}

export interface BracketMatch {
  round: number;
  position: number;
  team1Id: string | null;
  team2Id: string | null;
  nextMatchId?: string; // will be filled after creation
  bracket: string;
}

/**
 * Generate standard seeding matchups for single/double elimination.
 * Uses the standard tournament seeding: 1v16, 8v9, 5v12, 4v13, 6v11, 3v14, 7v10, 2v15, etc.
 * If team count is not power of 2, top seeds get byes (represented as null team2Id).
 */
function generateSeededMatchups(numTeams: number): [number | null, number | null][] {
  // Find next power of 2 >= numTeams
  const bracketSize = nextPowerOfTwo(numTeams);
  const numByes = bracketSize - numTeams;

  // Standard seeded bracket positions for a given bracket size
  // Position i in the bracket gets seed standardSeeds[i]
  const standardSeeds = generateStandardSeeds(bracketSize);

  // Top seeds get byes — we remove the lowest-seeded teams to create byes
  // Seeds (numTeams+1)..bracketSize are "bye seeds" (don't exist)
  // In standard seeding, the lowest seeds are spread throughout.
  // Byes go to the top seeds: remove the lowest seeds from the bracket.

  const matchups: [number | null, number | null][] = [];
  const actualSeeds: (number | null)[] = standardSeeds.map(s =>
    s > numTeams ? null : s
  );

  // Pair up: position 0 vs 1, 2 vs 3, etc.
  for (let i = 0; i < actualSeeds.length; i += 2) {
    const seed1 = actualSeeds[i];
    const seed2 = actualSeeds[i + 1];
    matchups.push([seed1, seed2]);
  }

  return matchups;
}

/**
 * Generate the standard seeding order for a bracket of size N (power of 2).
 * Returns an array where index i is the seed placed at bracket position i.
 * Standard seeding ensures:
 * - Seed 1 and 2 are in opposite halves
 * - Seeds 1,2,3,4 are in different quarters
 * - etc.
 */
function generateStandardSeeds(size: number): number[] {
  if (size === 1) return [1];
  if (size === 2) return [1, 2];

  const half = size / 2;
  const seeds: number[] = [];

  for (let i = 0; i < half; i++) {
    const topSeed = i + 1;
    const bottomSeed = half * 2 - i;
    seeds.push(topSeed);
    seeds.push(bottomSeed);
  }

  // The above gives us [1, 16, 2, 15, 3, 14, 4, 13, 5, 12, 6, 11, 7, 10, 8, 9]
  // Now we need to properly arrange them into bracket positions
  // Using recursive approach to ensure proper bracket placement
  return arrangeSeeds(seeds);
}

/**
 * Recursively arrange seeds so that bracket halves are balanced.
 * After arrangement:
 * - Round 1 pairings: (pos0 vs pos1), (pos2 vs pos3), etc.
 * - Winners of (0,1) and (2,3) should meet in next round
 */
function arrangeSeeds(seeds: number[]): number[] {
  if (seeds.length <= 2) return seeds;

  const topHalf: number[] = [];
  const bottomHalf: number[] = [];

  for (let i = 0; i < seeds.length; i += 2) {
    topHalf.push(seeds[i]);
    bottomHalf.push(seeds[i + 1]);
  }

  const arrangedTop = arrangeSeeds(topHalf);
  const arrangedBottom = arrangeSeeds(bottomHalf);

  // Interleave: top[0], bottom[0], top[1], bottom[1], ...
  const result: number[] = [];
  for (let i = 0; i < arrangedTop.length; i++) {
    result.push(arrangedTop[i]);
    result.push(arrangedBottom[i]);
  }

  return result;
}

function nextPowerOfTwo(n: number): number {
  if (n <= 0) return 1;
  let power = 1;
  while (power < n) power *= 2;
  return power;
}

function log2(n: number): number {
  return Math.log2(n);
}

/**
 * Generate single elimination bracket matches.
 * Returns an array of BracketMatch objects ordered by round.
 */
export function generateSingleEliminationBracket(teams: SeedTeam[]): BracketMatch[] {
  const numTeams = teams.length;
  if (numTeams < 2) return [];

  const bracketSize = nextPowerOfTwo(numTeams);
  const totalRounds = log2(bracketSize);

  // Create a map from seed number to team
  const seedMap = new Map<number, SeedTeam>();
  for (const team of teams) {
    seedMap.set(team.seed, team);
  }

  // Generate first round matchups
  const firstRoundMatchups = generateSeededMatchups(numTeams);
  const numFirstRoundMatches = firstRoundMatchups.length;

  const matches: BracketMatch[] = [];

  // Generate all rounds
  let matchesInCurrentRound = numFirstRoundMatches;
  const roundSizes: number[] = [numFirstRoundMatches];

  for (let r = 1; r < totalRounds; r++) {
    matchesInCurrentRound = matchesInCurrentRound / 2;
    roundSizes.push(matchesInCurrentRound);
  }

  // First: create round 1 matches
  for (let i = 0; i < firstRoundMatchups.length; i++) {
    const [seed1, seed2] = firstRoundMatchups[i];
    const team1 = seed1 ? seedMap.get(seed1)?.teamId ?? null : null;
    const team2 = seed2 ? seedMap.get(seed2)?.teamId ?? null : null;

    matches.push({
      round: 1,
      position: i,
      team1Id: team1,
      team2Id: team2,
      bracket: 'winners',
    });
  }

  // For subsequent rounds, we need to link nextMatchId
  // Round R, match position P advances to Round R+1, match position floor(P/2)
  // So we create all matches first, then link them

  // Create matches for rounds 2..totalRounds
  for (let r = 1; r < totalRounds; r++) {
    const numMatches = roundSizes[r];
    for (let p = 0; p < numMatches; p++) {
      matches.push({
        round: r + 1,
        position: p,
        team1Id: null,
        team2Id: null,
        bracket: 'winners',
      });
    }
  }

  // Now link nextMatchId for each match (except the final)
  for (const match of matches) {
    if (match.round < totalRounds) {
      const nextRound = match.round + 1;
      const nextPosition = Math.floor(match.position / 2);
      const nextMatch = matches.find(
        m => m.round === nextRound && m.position === nextPosition
      );
      if (nextMatch) {
        match.nextMatchId = `winners_round${nextRound}_pos${nextPosition}`;
      }
    }
  }

  return matches;
}

/**
 * Generate double elimination bracket matches.
 * Winners bracket + losers bracket.
 */
export function generateDoubleEliminationBracket(teams: SeedTeam[]): BracketMatch[] {
  const numTeams = teams.length;
  if (numTeams < 2) return [];

  const bracketSize = nextPowerOfTwo(numTeams);
  const winnersRounds = log2(bracketSize);
  const losersRounds = winnersRounds + (winnersRounds > 1 ? 1 : 0); // extra round for final

  // Create a map from seed number to team
  const seedMap = new Map<number, SeedTeam>();
  for (const team of teams) {
    seedMap.set(team.seed, team);
  }

  const matches: BracketMatch[] = [];

  // Winners bracket: same as single elimination first round
  const firstRoundMatchups = generateSeededMatchups(numTeams);

  // Round 1 - Winners Bracket
  for (let i = 0; i < firstRoundMatchups.length; i++) {
    const [seed1, seed2] = firstRoundMatchups[i];
    const team1 = seed1 ? seedMap.get(seed1)?.teamId ?? null : null;
    const team2 = seed2 ? seedMap.get(seed2)?.teamId ?? null : null;

    matches.push({
      round: 1,
      position: i,
      team1Id: team1,
      team2Id: team2,
      bracket: 'winners',
    });
  }

  // Subsequent winners bracket rounds
  let matchesInRound = firstRoundMatchups.length;
  for (let r = 2; r <= winnersRounds; r++) {
    matchesInRound = matchesInRound / 2;
    for (let p = 0; p < matchesInRound; p++) {
      matches.push({
        round: r,
        position: p,
        team1Id: null,
        team2Id: null,
        bracket: 'winners',
      });
    }
  }

  // Losers bracket rounds
  // Losers bracket has roughly 2*winnersRounds - 1 rounds
  // The number of teams dropping to losers bracket each round varies
  let loserMatches = 0;
  let prevWinnerMatches = firstRoundMatchups.length;

  for (let r = 1; r <= losersRounds; r++) {
    // Number of matches in losers round depends on:
    // - teams dropping from winners bracket
    // - teams advancing from previous losers round
    if (r === 1) {
      // First losers round: half of first round losers
      loserMatches = Math.floor(prevWinnerMatches / 2);
    } else if (r === 2) {
      // Second losers round: remaining first round losers + first round losers winners
      loserMatches = Math.floor(prevWinnerMatches / 2);
    } else {
      // Subsequent rounds
      const dropCount = Math.max(1, Math.floor(prevWinnerMatches / 2));
      const advanceCount = loserMatches > 0 ? Math.floor(loserMatches / 2) : 0;
      loserMatches = Math.floor((dropCount + advanceCount) / 2);
    }

    if (loserMatches <= 0) break;

    for (let p = 0; p < loserMatches; p++) {
      matches.push({
        round: r,
        position: p,
        team1Id: null,
        team2Id: null,
        bracket: 'losers',
      });
    }

    prevWinnerMatches = Math.max(1, Math.floor(prevWinnerMatches / 2));
  }

  // Grand final
  matches.push({
    round: 1,
    position: 0,
    team1Id: null, // winners bracket champion
    team2Id: null, // losers bracket champion
    bracket: 'grand_final',
  });

  // Link winners bracket nextMatchId
  for (const match of matches) {
    if (match.bracket === 'winners' && match.round < winnersRounds) {
      match.nextMatchId = `winners_round${match.round + 1}_pos${Math.floor(match.position / 2)}`;
    }
  }

  return matches;
}

/**
 * Generate round robin matches where every team plays every other team once.
 * Uses the circle method for scheduling.
 */
export function generateRoundRobinMatches(teams: SeedTeam[]): BracketMatch[] {
  const numTeams = teams.length;
  if (numTeams < 2) return [];

  // Create a map from seed number to team
  const seedMap = new Map<number, SeedTeam>();
  for (const team of teams) {
    seedMap.set(team.seed, team);
  }

  const matches: BracketMatch[] = [];
  let position = 0;

  // Sort teams by seed
  const sortedTeams = teams
    .slice()
    .sort((a, b) => a.seed - b.seed)
    .map(t => t.teamId);

  // If odd number of teams, add a "bye" (null)
  const effectiveTeams = numTeams % 2 === 0
    ? [...sortedTeams]
    : [...sortedTeams, null as unknown as string];

  const n = effectiveTeams.length;
  const numRounds = n - 1;

  // Circle method: fix first team, rotate the rest
  const teamsArr = [...effectiveTeams];

  for (let round = 1; round <= numRounds; round++) {
    const roundMatchups: [string | null, string | null][] = [];

    for (let i = 0; i < n / 2; i++) {
      const team1 = teamsArr[i];
      const team2 = teamsArr[n - 1 - i];

      // Alternate home/away to ensure fairness
      if (round % 2 === 0) {
        roundMatchups.push([team2, team1]);
      } else {
        roundMatchups.push([team1, team2]);
      }
    }

    for (const [t1, t2] of roundMatchups) {
      // Skip matches where one team is a bye
      if (t1 === null || t2 === null) continue;

      matches.push({
        round,
        position: position++,
        team1Id: t1,
        team2Id: t2,
        bracket: 'round_robin',
      });
    }

    // Rotate: fix first element, rotate the rest clockwise
    const fixed = teamsArr[0];
    const last = teamsArr[n - 1];
    for (let i = n - 1; i > 1; i--) {
      teamsArr[i] = teamsArr[i - 1];
    }
    teamsArr[1] = last;
  }

  return matches;
}

/**
 * Main bracket generation function that dispatches to the correct algorithm.
 */
export function generateBracket(
  format: string,
  teams: SeedTeam[]
): BracketMatch[] {
  switch (format) {
    case 'single_elimination':
      return generateSingleEliminationBracket(teams);
    case 'double_elimination':
      return generateDoubleEliminationBracket(teams);
    case 'round_robin':
      return generateRoundRobinMatches(teams);
    default:
      throw new Error(`Unsupported tournament format: ${format}`);
  }
}

/**
 * Determine the winner of a match based on scores.
 * Returns 'team1', 'team2', or 'draw'.
 */
export function determineMatchWinner(
  score1: number,
  score2: number,
  winsNeeded: number
): 'team1' | 'team2' | 'draw' {
  if (score1 > score2) return 'team1';
  if (score2 > score1) return 'team2';
  return 'draw';
}

/**
 * Check if the tournament should be auto-completed.
 * For single/double elimination: check if the final match is completed.
 * For round robin: check if all matches are completed.
 */
export function shouldAutoCompleteTournament(
  format: string,
  totalRounds: number,
  completedMatches: number,
  totalMatches: number
): boolean {
  if (format === 'single_elimination' || format === 'double_elimination') {
    // Tournament is done when final match is completed
    return completedMatches === totalMatches;
  }
  // Round robin: all matches must be completed
  return completedMatches === totalMatches;
}

/**
 * Recalculate standings for a tournament based on completed matches.
 */
export interface StandingCalculation {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
}

export function calculateStandings(
  tournamentTeams: { teamId: string; teamName: string }[],
  completedMatches: { team1Id: string; team2Id: string; score1: number; score2: number }[],
  pointsWin: number,
  pointsDraw: number,
  pointsLoss: number
): StandingCalculation[] {
  const standingsMap = new Map<string, StandingCalculation>();

  // Initialize standings
  for (const tt of tournamentTeams) {
    standingsMap.set(tt.teamId, {
      teamId: tt.teamId,
      teamName: tt.teamName,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      points: 0,
    });
  }

  // Process completed matches
  for (const match of completedMatches) {
    const s1 = standingsMap.get(match.team1Id);
    const s2 = standingsMap.get(match.team2Id);
    if (!s1 || !s2) continue;

    s1.played++;
    s2.played++;
    s1.pointsFor += match.score1;
    s1.pointsAgainst += match.score2;
    s2.pointsFor += match.score2;
    s2.pointsAgainst += match.score1;

    if (match.score1 > match.score2) {
      s1.wins++;
      s1.points += pointsWin;
      s2.losses++;
      s2.points += pointsLoss;
    } else if (match.score2 > match.score1) {
      s2.wins++;
      s2.points += pointsWin;
      s1.losses++;
      s1.points += pointsLoss;
    } else {
      s1.draws++;
      s1.points += pointsDraw;
      s2.draws++;
      s2.points += pointsDraw;
    }
  }

  // Sort by points (desc), then by points difference (desc), then by points for (desc)
  const standings = Array.from(standingsMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.pointsFor - a.pointsAgainst;
    const diffB = b.pointsFor - b.pointsAgainst;
    if (diffB !== diffA) return diffB - diffA;
    return b.pointsFor - a.pointsFor;
  });

  return standings;
}
