/**
 * Seed data script for tournament management system
 * Creates a sample tournament with 8 teams and sample matches
 */

import { db } from '@/lib/db';

export async function seedData() {
  console.log('🌱 Seeding tournament data...');

  // Clean up existing data first
  await db.standing.deleteMany();
  await db.match.deleteMany();
  await db.player.deleteMany();
  await db.tournamentTeam.deleteMany();
  await db.tournament.deleteMany();
  await db.team.deleteMany();

  // Create teams
  const teamNames = [
    { name: 'Phoenix Rising', tag: 'PHX', description: 'Rising from the ashes' },
    { name: 'Thunder Wolves', tag: 'TWL', description: 'Unleash the thunder' },
    { name: 'Shadow Dragons', tag: 'SHD', description: 'Strike from the shadows' },
    { name: 'Iron Titans', tag: 'IRT', description: 'Unbreakable spirit' },
    { name: 'Storm Breakers', tag: 'STB', description: 'Weather the storm' },
    { name: 'Crimson Falcons', tag: 'CRF', description: 'Soar above all' },
    { name: 'Golden Eagles', tag: 'GLE', description: 'Majestic and powerful' },
    { name: 'Arctic Foxes', tag: 'AFX', description: 'Cunning and swift' },
  ];

  const teams = [];
  for (const t of teamNames) {
    const team = await db.team.create({
      data: t,
    });
    teams.push(team);
  }

  // Create a single elimination tournament
  const tournament = await db.tournament.create({
    data: {
      name: 'Championship Series 2025',
      description: 'The ultimate showdown between the top 8 teams. A single elimination bracket to determine the champion.',
      sport: 'Esports',
      format: 'single_elimination',
      maxTeams: 8,
      winsNeeded: 1,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-15'),
      status: 'registration',
      coverColor: '#f59e0b',
    },
  });

  // Add teams to tournament with seeds
  const tournamentTeams = [];
  for (let i = 0; i < teams.length; i++) {
    const tt = await db.tournamentTeam.create({
      data: {
        tournamentId: tournament.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });
    tournamentTeams.push({ ...tt, team: teams[i] });

    // Add 3-5 players per team
    const playerCount = 3 + Math.floor(Math.random() * 3);
    const roles = ['Captain', 'Player', 'Substitute'];
    for (let j = 0; j < playerCount; j++) {
      const playerNames = [
        'Alex Chen', 'Jordan Park', 'Sam Lee', 'Kim Tanaka', 'Rio Santos',
        'Casey Morgan', 'Taylor Swift', 'Morgan Freeman', 'Drew Barry', 'Jamie Fox',
      ];
      await db.player.create({
        data: {
          name: playerNames[Math.floor(Math.random() * playerNames.length)],
          role: j === 0 ? 'Captain' : roles[Math.floor(Math.random() * roles.length)],
          tournamentTeamId: tt.id,
        },
      });
    }
  }

  // Create a round robin tournament as well
  const tournament2 = await db.tournament.create({
    data: {
      name: 'Spring League 2025',
      description: 'A round robin league format where every team plays every other team once.',
      sport: 'Football',
      format: 'round_robin',
      maxTeams: 8,
      winsNeeded: 1,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      status: 'draft',
      coverColor: '#10b981',
    },
  });

  // Add teams to second tournament
  for (let i = 0; i < teams.length; i++) {
    await db.tournamentTeam.create({
      data: {
        tournamentId: tournament2.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });
  }

  // Create a completed tournament with results
  const tournament3 = await db.tournament.create({
    data: {
      name: 'Winter Cup 2024',
      description: 'Completed tournament from last winter season.',
      sport: 'Basketball',
      format: 'single_elimination',
      maxTeams: 8,
      winsNeeded: 1,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-15'),
      status: 'completed',
      coverColor: '#6366f1',
    },
  });

  // Add teams to third tournament
  const tournament3Teams = [];
  for (let i = 0; i < teams.length; i++) {
    const tt = await db.tournamentTeam.create({
      data: {
        tournamentId: tournament3.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });
    tournament3Teams.push({ ...tt, team: teams[i] });
  }

  // Create completed matches for tournament 3
  // Standard seeding: 1v8, 4v5, 3v6, 2v7
  const seeds = tournament3Teams.map(t => ({ id: t.id, teamId: t.teamId, seed: t.seed }));

  // Round 1 matches
  const round1Matchups = [
    [seeds[0], seeds[7]], // 1v8
    [seeds[3], seeds[4]], // 4v5
    [seeds[2], seeds[5]], // 3v6
    [seeds[1], seeds[6]], // 2v7
  ];

  const round1Results = [
    { score1: 2, score2: 0 }, // seed 1 wins
    { score1: 1, score2: 2 }, // seed 5 wins
    { score1: 2, score2: 1 }, // seed 3 wins
    { score1: 0, score2: 2 }, // seed 7 wins
  ];

  const round1Winners = [];
  for (let i = 0; i < round1Matchups.length; i++) {
    const [m1, m2] = round1Matchups[i];
    const result = round1Results[i];
    const winnerId = result.score1 > result.score2 ? m1.teamId : m2.teamId;

    await db.match.create({
      data: {
        tournamentId: tournament3.id,
        round: 1,
        position: i,
        team1Id: m1.teamId,
        team2Id: m2.teamId,
        score1: result.score1,
        score2: result.score2,
        status: 'completed',
        bracket: 'winners',
        completedAt: new Date('2024-12-02'),
      },
    });

    round1Winners.push(winnerId);
  }

  // Round 2 matches (semifinals)
  const round2Matchups = [
    [round1Winners[0], round1Winners[1]],
    [round1Winners[2], round1Winners[3]],
  ];

  const round2Results = [
    { score1: 2, score2: 1 },
    { score1: 2, score2: 0 },
  ];

  const round2Winners = [];
  for (let i = 0; i < round2Matchups.length; i++) {
    const [t1, t2] = round2Matchups[i];
    const result = round2Results[i];
    const winnerId = result.score1 > result.score2 ? t1 : t2;

    await db.match.create({
      data: {
        tournamentId: tournament3.id,
        round: 2,
        position: i,
        team1Id: t1,
        team2Id: t2,
        score1: result.score1,
        score2: result.score2,
        status: 'completed',
        bracket: 'winners',
        completedAt: new Date('2024-12-08'),
      },
    });

    round2Winners.push(winnerId);
  }

  // Final
  await db.match.create({
    data: {
      tournamentId: tournament3.id,
      round: 3,
      position: 0,
      team1Id: round2Winners[0],
      team2Id: round2Winners[1],
      score1: 3,
      score2: 1,
      status: 'completed',
      bracket: 'winners',
      completedAt: new Date('2024-12-15'),
    },
  });

  // Create standings for completed tournament
  const teamNameMap = new Map(teams.map(t => [t.id, t.name]));
  const finalWinner = round2Winners[0];
  const finalLoser = round2Winners[1];

  const standingData = [
    { teamId: finalWinner, wins: 3, draws: 0, losses: 0, pf: 7, pa: 2 },
    { teamId: finalLoser, wins: 2, draws: 0, losses: 1, pf: 5, pa: 4 },
    // Semifinal losers
    { teamId: round2Matchups[0][result.score1 > result.score2 ? 1 : 0], wins: 1, draws: 0, losses: 1, pf: 2, pa: 2 },
  ];

  // Let me just create standings for all 8 teams
  await db.standing.create({
    data: {
      tournamentId: tournament3.id,
      teamId: finalWinner,
      teamName: teamNameMap.get(finalWinner) ?? 'Unknown',
      played: 3, wins: 3, draws: 0, losses: 0,
      pointsFor: 7, pointsAgainst: 2, points: 9, rank: 1,
    },
  });

  await db.standing.create({
    data: {
      tournamentId: tournament3.id,
      teamId: finalLoser,
      teamName: teamNameMap.get(finalLoser) ?? 'Unknown',
      played: 3, wins: 2, draws: 0, losses: 1,
      pointsFor: 5, pointsAgainst: 4, points: 6, rank: 2,
    },
  });

  // Add remaining teams standings
  const remainingTeams = tournament3Teams
    .map(t => t.teamId)
    .filter(id => id !== finalWinner && id !== finalLoser);

  for (let i = 0; i < remainingTeams.length; i++) {
    const teamId = remainingTeams[i];
    await db.standing.create({
      data: {
        tournamentId: tournament3.id,
        teamId,
        teamName: teamNameMap.get(teamId) ?? 'Unknown',
        played: 1, wins: i < 2 ? 1 : 0, draws: 0, losses: i < 2 ? 0 : 1,
        pointsFor: i < 2 ? 2 : 0, pointsAgainst: i < 2 ? 1 : 2,
        points: i < 2 ? 3 : 0, rank: 3 + i,
      },
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log(`  - ${teams.length} teams`);
  console.log(`  - 3 tournaments (${tournament.name}, ${tournament2.name}, ${tournament3.name})`);
  console.log(`  - Tournament ${tournament.name} is in registration`);
  console.log(`  - Tournament ${tournament2.name} is in draft`);
  console.log(`  - Tournament ${tournament3.name} is completed with results`);

  return {
    teams: teams.length,
    tournaments: 3,
    tournamentIds: [tournament.id, tournament2.id, tournament3.id],
  };
}

// Fix the reference to `result` above - let me handle this properly
// The code above has a bug with `result` in the loop. Let me fix the seed function.
// Actually, I'll rewrite the whole thing more carefully.

export async function seedDataFixed() {
  console.log('🌱 Seeding tournament data...');

  // Clean up existing data first
  await db.standing.deleteMany();
  await db.match.deleteMany();
  await db.player.deleteMany();
  await db.tournamentTeam.deleteMany();
  await db.tournament.deleteMany();
  await db.team.deleteMany();

  // Create teams
  const teamData = [
    { name: 'Phoenix Rising', tag: 'PHX', description: 'Rising from the ashes' },
    { name: 'Thunder Wolves', tag: 'TWL', description: 'Unleash the thunder' },
    { name: 'Shadow Dragons', tag: 'SHD', description: 'Strike from the shadows' },
    { name: 'Iron Titans', tag: 'IRT', description: 'Unbreakable spirit' },
    { name: 'Storm Breakers', tag: 'STB', description: 'Weather the storm' },
    { name: 'Crimson Falcons', tag: 'CRF', description: 'Soar above all' },
    { name: 'Golden Eagles', tag: 'GLE', description: 'Majestic and powerful' },
    { name: 'Arctic Foxes', tag: 'AFX', description: 'Cunning and swift' },
  ];

  const teams = [];
  for (const t of teamData) {
    const team = await db.team.create({ data: t });
    teams.push(team);
  }

  const teamNameMap = new Map(teams.map(t => [t.id, t.name]));

  // ==========================================
  // Tournament 1: Championship Series (registration)
  // ==========================================
  const tournament1 = await db.tournament.create({
    data: {
      name: 'Championship Series 2025',
      description: 'The ultimate showdown between the top 8 teams. A single elimination bracket to determine the champion.',
      sport: 'Esports',
      format: 'single_elimination',
      maxTeams: 8,
      winsNeeded: 1,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-03-15'),
      status: 'registration',
      coverColor: '#f59e0b',
    },
  });

  const playerNames = [
    'Alex Chen', 'Jordan Park', 'Sam Lee', 'Kim Tanaka', 'Rio Santos',
    'Casey Morgan', 'Drew Barry', 'Jamie Fox', 'Morgan Blake', 'Taylor Reed',
    'Chris Evans', 'Pat Murphy', 'Robin Song', 'Avery Quinn', 'Dakota Stone',
  ];

  for (let i = 0; i < teams.length; i++) {
    const tt = await db.tournamentTeam.create({
      data: {
        tournamentId: tournament1.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });

    const numPlayers = 3 + (i % 3);
    for (let j = 0; j < numPlayers; j++) {
      await db.player.create({
        data: {
          name: playerNames[(i * 5 + j) % playerNames.length],
          role: j === 0 ? 'Captain' : j === 1 ? 'Vice Captain' : 'Player',
          tournamentTeamId: tt.id,
        },
      });
    }
  }

  // ==========================================
  // Tournament 2: Spring League (draft, round robin)
  // ==========================================
  const tournament2 = await db.tournament.create({
    data: {
      name: 'Spring League 2025',
      description: 'A round robin league format where every team plays every other team once.',
      sport: 'Football',
      format: 'round_robin',
      maxTeams: 8,
      winsNeeded: 1,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      startDate: new Date('2025-04-01'),
      endDate: new Date('2025-06-30'),
      status: 'draft',
      coverColor: '#10b981',
    },
  });

  for (let i = 0; i < teams.length; i++) {
    await db.tournamentTeam.create({
      data: {
        tournamentId: tournament2.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });
  }

  // ==========================================
  // Tournament 3: Winter Cup (completed with results)
  // ==========================================
  const tournament3 = await db.tournament.create({
    data: {
      name: 'Winter Cup 2024',
      description: 'Completed tournament from last winter season.',
      sport: 'Basketball',
      format: 'single_elimination',
      maxTeams: 8,
      winsNeeded: 1,
      pointsWin: 3,
      pointsDraw: 1,
      pointsLoss: 0,
      startDate: new Date('2024-12-01'),
      endDate: new Date('2024-12-15'),
      status: 'completed',
      coverColor: '#6366f1',
    },
  });

  const t3Teams = [];
  for (let i = 0; i < teams.length; i++) {
    const tt = await db.tournamentTeam.create({
      data: {
        tournamentId: tournament3.id,
        teamId: teams[i].id,
        seed: i + 1,
      },
    });
    t3Teams.push({ id: tt.id, teamId: teams[i].id, seed: tt.seed });
  }

  // Standard seeding: 1v8, 4v5, 3v6, 2v7
  const round1Pairs = [
    { t1: t3Teams[0].teamId, t2: t3Teams[7].teamId, s1: 2, s2: 0 }, // seed 1 beats seed 8
    { t1: t3Teams[3].teamId, t2: t3Teams[4].teamId, s1: 1, s2: 2 }, // seed 5 beats seed 4
    { t1: t3Teams[2].teamId, t2: t3Teams[5].teamId, s1: 2, s2: 1 }, // seed 3 beats seed 6
    { t1: t3Teams[1].teamId, t2: t3Teams[6].teamId, s1: 0, s2: 2 }, // seed 7 beats seed 2
  ];

  const r1Winners: string[] = [];
  for (let i = 0; i < round1Pairs.length; i++) {
    const { t1, t2, s1, s2 } = round1Pairs[i];
    await db.match.create({
      data: {
        tournamentId: tournament3.id,
        round: 1,
        position: i,
        team1Id: t1,
        team2Id: t2,
        score1: s1,
        score2: s2,
        status: 'completed',
        bracket: 'winners',
        completedAt: new Date('2024-12-02'),
      },
    });
    r1Winners.push(s1 > s2 ? t1 : t2);
  }

  // Semifinals
  const round2Pairs = [
    { t1: r1Winners[0], t2: r1Winners[1], s1: 2, s2: 1 },
    { t1: r1Winners[2], t2: r1Winners[3], s1: 2, s2: 0 },
  ];

  const r2Winners: string[] = [];
  for (let i = 0; i < round2Pairs.length; i++) {
    const { t1, t2, s1, s2 } = round2Pairs[i];
    await db.match.create({
      data: {
        tournamentId: tournament3.id,
        round: 2,
        position: i,
        team1Id: t1,
        team2Id: t2,
        score1: s1,
        score2: s2,
        status: 'completed',
        bracket: 'winners',
        completedAt: new Date('2024-12-08'),
      },
    });
    r2Winners.push(s1 > s2 ? t1 : t2);
  }

  // Final
  const champion = r2Winners[0];
  const runnerUp = r2Winners[1];
  await db.match.create({
    data: {
      tournamentId: tournament3.id,
      round: 3,
      position: 0,
      team1Id: champion,
      team2Id: runnerUp,
      score1: 3,
      score2: 1,
      status: 'completed',
      bracket: 'winners',
      completedAt: new Date('2024-12-15'),
    },
  });

  // Standings for tournament 3
  // Champion: 3 wins, 0 losses, 7 pf, 2 pa
  // Runner-up: 2 wins, 1 loss, 5 pf, 4 pa
  // Semi losers: 1 win, 1 loss each
  // Quarter losers: 0 wins, 1 loss each

  const allTeamIds = t3Teams.map(t => t.teamId);
  const semiLosers = [round2Pairs[0][round2Pairs[0].s1 > round2Pairs[0].s2 ? 't2' : 't1'], round2Pairs[1][round2Pairs[1].s1 > round2Pairs[1].s2 ? 't2' : 't1']];
  const quarterLosers = allTeamIds.filter(
    id => id !== champion && id !== runnerUp && !semiLosers.includes(id)
  );

  // Champion
  await db.standing.create({
    data: {
      tournamentId: tournament3.id, teamId: champion,
      teamName: teamNameMap.get(champion) ?? '',
      played: 3, wins: 3, draws: 0, losses: 0,
      pointsFor: 7, pointsAgainst: 2, points: 9, rank: 1,
    },
  });

  // Runner-up
  await db.standing.create({
    data: {
      tournamentId: tournament3.id, teamId: runnerUp,
      teamName: teamNameMap.get(runnerUp) ?? '',
      played: 3, wins: 2, draws: 0, losses: 1,
      pointsFor: 5, pointsAgainst: 4, points: 6, rank: 2,
    },
  });

  // Semi-final losers (rank 3-4)
  for (let i = 0; i < semiLosers.length; i++) {
    await db.standing.create({
      data: {
        tournamentId: tournament3.id, teamId: semiLosers[i],
        teamName: teamNameMap.get(semiLosers[i]) ?? '',
        played: 2, wins: 1, draws: 0, losses: 1,
        pointsFor: 2, pointsAgainst: 3, points: 3, rank: 3 + i,
      },
    });
  }

  // Quarter-final losers (rank 5-8)
  for (let i = 0; i < quarterLosers.length; i++) {
    await db.standing.create({
      data: {
        tournamentId: tournament3.id, teamId: quarterLosers[i],
        teamName: teamNameMap.get(quarterLosers[i]) ?? '',
        played: 1, wins: 0, draws: 0, losses: 1,
        pointsFor: 0, pointsAgainst: 2, points: 0, rank: 5 + i,
      },
    });
  }

  console.log('✅ Seed data created successfully!');
  console.log(`  - ${teams.length} teams created`);
  console.log(`  - 3 tournaments created`);
  console.log(`  - Tournament "${tournament1.name}" (${tournament1.status})`);
  console.log(`  - Tournament "${tournament2.name}" (${tournament2.status})`);
  console.log(`  - Tournament "${tournament3.name}" (${tournament3.status}) with full results`);

  return {
    teamsCount: teams.length,
    tournamentsCount: 3,
    tournamentIds: [tournament1.id, tournament2.id, tournament3.id],
    tournamentNames: [tournament1.name, tournament2.name, tournament3.name],
  };
}
