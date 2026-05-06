import { create } from 'zustand';

export type TournamentFormat = 'single_elimination' | 'double_elimination' | 'round_robin';
export type TournamentStatus = 'draft' | 'registration' | 'active' | 'completed' | 'archived';
export type MatchStatus = 'pending' | 'live' | 'completed' | 'cancelled';
export type ViewMode = 'home' | 'create' | 'tournament' | 'manage-teams';

export interface Team {
  id: string;
  name: string;
  tag?: string;
  logo?: string;
  description?: string;
}

export interface Player {
  id: string;
  name: string;
  role: string;
  tournamentTeamId: string;
}

export interface TournamentTeam {
  id: string;
  tournamentId: string;
  teamId: string;
  seed: number;
  team?: Team;
  players?: Player[];
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  team1Id?: string;
  team2Id?: string;
  score1: number;
  score2: number;
  status: MatchStatus;
  bracket: string;
  nextMatchId?: string;
  scheduledAt?: string;
  completedAt?: string;
  venue?: string;
  team1?: Team;
  team2?: Team;
}

export interface Standing {
  id: string;
  tournamentId: string;
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  points: number;
  rank: number;
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  sport: string;
  format: TournamentFormat;
  maxTeams: number;
  winsNeeded: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  startDate?: string;
  endDate?: string;
  status: TournamentStatus;
  coverColor: string;
  createdAt: string;
  updatedAt: string;
  teams?: TournamentTeam[];
  matches?: Match[];
  standings?: Standing[];
  _count?: {
    teams: number;
    matches: number;
  };
}

interface AppState {
  // Current view
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  
  // Selected tournament
  selectedTournamentId: string | null;
  setSelectedTournamentId: (id: string | null) => void;
  
  // Tournament list
  tournaments: Tournament[];
  setTournaments: (tournaments: Tournament[]) => void;
  
  // Current tournament detail
  currentTournament: Tournament | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Active tournament tab
  tournamentTab: 'bracket' | 'teams' | 'standings' | 'matches' | 'settings';
  setTournamentTab: (tab: 'bracket' | 'teams' | 'standings' | 'matches' | 'settings') => void;
  
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
  
  selectedTournamentId: null,
  setSelectedTournamentId: (id) => set({ selectedTournamentId: id }),
  
  tournaments: [],
  setTournaments: (tournaments) => set({ tournaments }),
  
  currentTournament: null,
  setCurrentTournament: (tournament) => set({ currentTournament: tournament }),
  
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  
  tournamentTab: 'bracket',
  setTournamentTab: (tab) => set({ tournamentTab: tab }),
  
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
