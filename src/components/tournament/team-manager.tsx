'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore, type Tournament, type TournamentTeam, type Team, type Player, type TournamentFormat } from '@/lib/store';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

import {
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  Plus,
  Search,
  Star,
  Shield,
  Crown,
  ChevronRight,
  AlertTriangle,
  Hash,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const FORMAT_LABELS: Record<TournamentFormat, string> = {
  single_elimination: 'Олимпийская система',
  double_elimination: 'Двойная олимпийская',
  round_robin: 'Круговая система',
};

const FORMAT_VARIANTS: Record<TournamentFormat, 'default' | 'secondary' | 'outline'> = {
  single_elimination: 'default',
  double_elimination: 'secondary',
  round_robin: 'outline',
};

const SEED_COLORS = [
  'bg-rose-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-violet-500',
  'bg-pink-500',
  'bg-fuchsia-500',
  'bg-lime-500',
  'bg-sky-500',
  'bg-indigo-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-green-500',
  'bg-blue-500',
];

const SEED_BORDER_COLORS = [
  'border-l-rose-500',
  'border-l-orange-500',
  'border-l-amber-500',
  'border-l-emerald-500',
  'border-l-teal-500',
  'border-l-cyan-500',
  'border-l-violet-500',
  'border-l-pink-500',
  'border-l-fuchsia-500',
  'border-l-lime-500',
  'border-l-sky-500',
  'border-l-indigo-500',
  'border-l-red-500',
  'border-l-yellow-500',
  'border-l-green-500',
  'border-l-blue-500',
];

const PLAYER_ROLES = [
  { value: 'Captain', label: 'Капитан', icon: Crown },
  { value: 'Vice Captain', label: 'Вице-капитан', icon: Shield },
  { value: 'Player', label: 'Игрок', icon: UserMinus },
  { value: 'Substitute', label: 'Запасной', icon: Users },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSeedColor(seed: number): string {
  return SEED_COLORS[(seed - 1) % SEED_COLORS.length];
}

function getSeedBorderColor(seed: number): string {
  return SEED_BORDER_COLORS[(seed - 1) % SEED_BORDER_COLORS.length];
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'Captain':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'Vice Captain':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'Substitute':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-secondary text-secondary-foreground';
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case 'Captain':
      return Crown;
    case 'Vice Captain':
      return Shield;
    case 'Substitute':
      return Users;
    default:
      return UserMinus;
  }
}

function getRoleLabel(role: string): string {
  const found = PLAYER_ROLES.find((r) => r.value === role);
  return found ? found.label : role;
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      {/* Progress skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-2 w-full" />
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-l-4">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-5 w-36" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-full" />
                  <Separator className="my-3" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onAddTeam }: { onAddTeam: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 py-16 px-8 text-center"
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        В этом турнире ещё нет команд
      </h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Добавьте команды, чтобы начать формирование сетки турнира. Вы можете выбрать существующие команды или создать новые.
      </p>
      <Button onClick={onAddTeam} className="gap-2">
        <Plus className="h-4 w-4" />
        Добавить первую команду
      </Button>
    </motion.div>
  );
}

function PlayerRow({
  player,
  tournamentId,
  teamId,
  onRemove,
}: {
  player: Player;
  tournamentId: string;
  teamId: string;
  onRemove: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const RoleIcon = getRoleIcon(player.role);

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/teams/${teamId}/players/${player.id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось удалить игрока');
      }
      toast.success('Игрок удалён');
      onRemove();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления игрока');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className="group flex items-center justify-between gap-2 rounded-md py-1.5 px-2 transition-colors hover:bg-muted/50"
    >
      <div className="flex items-center gap-2 min-w-0">
        <RoleIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{player.name}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge variant="outline" className={`text-xs ${getRoleBadgeClasses(player.role)}`}>
          {getRoleLabel(player.role)}
        </Badge>
        <button
          onClick={handleRemove}
          disabled={removing}
          className="flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
          aria-label={`Удалить игрока ${player.name}`}
        >
          <UserMinus className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function TeamCard({
  tournamentTeam,
  tournamentId,
  canEdit,
  onAddPlayer,
  onRefresh,
}: {
  tournamentTeam: TournamentTeam;
  tournamentId: string;
  canEdit: boolean;
  onAddPlayer: (ttId: string, teamId: string) => void;
  onRefresh: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const team = tournamentTeam.team;
  const players = tournamentTeam.players || [];
  const borderColor = getSeedBorderColor(tournamentTeam.seed);
  const seedColor = getSeedColor(tournamentTeam.seed);

  const handleRemoveTeam = async () => {
    setRemoving(true);
    try {
      const res = await fetch(
        `/api/tournaments/${tournamentId}/teams/${tournamentTeam.teamId}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось удалить команду');
      }
      toast.success('Команда удалена из турнира');
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления команды');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`overflow-hidden border-l-4 ${borderColor} transition-shadow hover:shadow-md`}
      >
        <CardContent className="p-0">
          {/* Team header */}
          <div className="flex items-start gap-4 p-4 sm:p-6">
            {/* Seed badge */}
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${seedColor} text-lg font-bold text-white shadow-sm`}
            >
              {tournamentTeam.seed}
            </div>

            {/* Team info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold truncate">{team?.name || 'Безымянная команда'}</h3>
                {team?.tag && (
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold uppercase">
                    {team.tag}
                  </span>
                )}
              </div>
              {team?.description && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {team.description}
                </p>
              )}
              <p className="mt-1.5 text-xs text-muted-foreground">
                {players.length}{' '}
                {players.length === 1
                  ? 'игрок'
                  : players.length < 5
                    ? 'игрока'
                    : 'игроков'}
              </p>
            </div>

            {/* Actions */}
            {canEdit && (
              <div className="flex flex-col gap-1 flex-shrink-0">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Удалить</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить команду?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы уверены, что хотите удалить команду «{team?.name}» из турнира? Все игроки этой команды будут также удалены. Это действие нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleRemoveTeam}
                        disabled={removing}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        {removing ? 'Удаление...' : 'Удалить'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <Separator />

          {/* Players section */}
          <div className="p-4 sm:px-6 sm:pb-6 sm:pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Состав
              </h4>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={() => onAddPlayer(tournamentTeam.id, tournamentTeam.teamId)}
                >
                  <UserPlus className="h-3 w-3" />
                  Добавить игрока
                </Button>
              )}
            </div>

            {players.length > 0 ? (
              <div className="space-y-0.5">
                <AnimatePresence mode="popLayout">
                  {players.map((player) => (
                    <PlayerRow
                      key={player.id}
                      player={player}
                      tournamentId={tournamentId}
                      teamId={tournamentTeam.teamId}
                      onRemove={onRefresh}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Состав команды пока не указан
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function TeamManager() {
  const selectedTournamentId = useAppStore((s) => s.selectedTournamentId);
  const currentTournament = useAppStore((s) => s.currentTournament);
  const setCurrentTournament = useAppStore((s) => s.setCurrentTournament);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [addingTeam, setAddingTeam] = useState(false);
  const [addTeamTab, setAddTeamTab] = useState('existing');

  // Add team dialog state
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamSearch, setTeamSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamTag, setNewTeamTag] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [seedInput, setSeedInput] = useState('');
  const [addTeamLoading, setAddTeamLoading] = useState(false);

  // Add player dialog state
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [playerTournamentTeamId, setPlayerTournamentTeamId] = useState('');
  const [playerTeamId, setPlayerTeamId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [playerRole, setPlayerRole] = useState('Player');
  const [addPlayerLoading, setAddPlayerLoading] = useState(false);

  // ─── Fetch tournament ──────────────────────────────────────────────────────

  const fetchTournament = useCallback(async () => {
    if (!selectedTournamentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`);
      if (!res.ok) throw new Error('Не удалось загрузить турнир');
      const data: Tournament = await res.json();
      setTournament(data);
      setCurrentTournament(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка загрузки турнира');
    } finally {
      setLoading(false);
    }
  }, [selectedTournamentId, setCurrentTournament]);

  useEffect(() => {
    // Use currentTournament from store if it matches
    if (currentTournament && currentTournament.id === selectedTournamentId) {
      setTournament(currentTournament);
      setLoading(false);
      return;
    }
    fetchTournament();
  }, [selectedTournamentId, currentTournament, fetchTournament]);

  // ─── Compute values ────────────────────────────────────────────────────────

  const teams = tournament?.teams || [];
  const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);
  const maxTeams = tournament?.maxTeams || 16;
  const teamCount = teams.length;
  const progressPercent = maxTeams > 0 ? (teamCount / maxTeams) * 100 : 0;
  const canEdit =
    tournament?.status === 'draft' || tournament?.status === 'registration';
  const nextSeed =
    teams.length > 0 ? Math.max(...teams.map((t) => t.seed)) + 1 : 1;

  // ─── Fetch all teams for the "existing team" tab ──────────────────────────

  const fetchAllTeams = useCallback(async () => {
    setTeamsLoading(true);
    try {
      const res = await fetch('/api/teams');
      if (!res.ok) throw new Error('Не удалось загрузить команды');
      const data: Team[] = await res.json();
      setAllTeams(data);
    } catch {
      toast.error('Ошибка загрузки списка команд');
    } finally {
      setTeamsLoading(false);
    }
  }, []);

  // ─── Add team dialog handlers ──────────────────────────────────────────────

  const openAddTeamDialog = () => {
    setAddTeamTab('existing');
    setTeamSearch('');
    setSelectedTeam(null);
    setNewTeamName('');
    setNewTeamTag('');
    setNewTeamDescription('');
    setSeedInput(String(nextSeed));
    fetchAllTeams();
    setAddingTeam(true);
  };

  const filteredTeams = allTeams.filter((t) => {
    const query = teamSearch.toLowerCase();
    if (query === '') return true;
    return (
      t.name.toLowerCase().includes(query) ||
      (t.tag && t.tag.toLowerCase().includes(query))
    );
  });

  // Exclude teams already in the tournament
  const registeredTeamIds = new Set(teams.map((tt) => tt.teamId));
  const availableTeams = filteredTeams.filter((t) => !registeredTeamIds.has(t.id));

  const handleAddTeam = async () => {
    let finalTeamId = selectedTeam?.id;

    // If creating new team
    if (addTeamTab === 'new') {
      if (!newTeamName.trim()) {
        toast.error('Введите название команды');
        return;
      }
      setAddTeamLoading(true);
      try {
        const createRes = await fetch('/api/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newTeamName.trim(),
            tag: newTeamTag.trim() || undefined,
            description: newTeamDescription.trim() || undefined,
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json();
          throw new Error(data.error || 'Не удалось создать команду');
        }
        const createdTeam: Team = await createRes.json();
        finalTeamId = createdTeam.id;
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Ошибка создания команды');
        setAddTeamLoading(false);
        return;
      }
    }

    if (!finalTeamId) {
      toast.error('Выберите команду');
      setAddTeamLoading(false);
      return;
    }

    const seed = parseInt(seedInput, 10);
    if (isNaN(seed) || seed < 1) {
      toast.error('Введите корректный номер посева');
      setAddTeamLoading(false);
      return;
    }

    setAddTeamLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: finalTeamId, seed }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось добавить команду');
      }
      toast.success('Команда добавлена!');
      setAddingTeam(false);
      fetchTournament();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка добавления команды');
    } finally {
      setAddTeamLoading(false);
    }
  };

  // ─── Add player dialog handlers ────────────────────────────────────────────

  const openAddPlayerDialog = (ttId: string, tId: string) => {
    setPlayerTournamentTeamId(ttId);
    setPlayerTeamId(tId);
    setPlayerName('');
    setPlayerRole('Player');
    setPlayerDialogOpen(true);
  };

  const handleAddPlayer = async () => {
    if (!playerName.trim()) {
      toast.error('Введите имя игрока');
      return;
    }
    setAddPlayerLoading(true);
    try {
      const res = await fetch(
        `/api/tournaments/${selectedTournamentId}/teams/${playerTeamId}/players`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: playerName.trim(), role: playerRole }),
        }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Не удалось добавить игрока');
      }
      toast.success('Игрок добавлен!');
      setPlayerDialogOpen(false);
      fetchTournament();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка добавления игрока');
    } finally {
      setAddPlayerLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-4 h-10 w-10 text-muted-foreground" />
        <h3 className="text-lg font-semibold">Турнир не найден</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Выберите турнир для управления командами
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold sm:text-2xl">{tournament.name}</h1>
            <Badge variant={FORMAT_VARIANTS[tournament.format]}>
              {FORMAT_LABELS[tournament.format]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Управление составом команд турнира
          </p>
        </div>
        {canEdit && (
          <Button onClick={openAddTeamDialog} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Добавить команду
          </Button>
        )}
      </div>

      {/* ── Progress ───────────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {teamCount} из {maxTeams} команд
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* ── Teams Grid / Empty State ───────────────────────────────────────── */}
      {sortedTeams.length === 0 ? (
        <EmptyState onAddTeam={openAddTeamDialog} />
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {sortedTeams.map((tt) => (
              <TeamCard
                key={tt.id}
                tournamentTeam={tt}
                tournamentId={tournament.id}
                canEdit={canEdit}
                onAddPlayer={openAddPlayerDialog}
                onRefresh={fetchTournament}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Add Team Dialog ────────────────────────────────────────────────── */}
      <Dialog open={addingTeam} onOpenChange={setAddingTeam}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Добавить команду
            </DialogTitle>
          </DialogHeader>

          <Tabs value={addTeamTab} onValueChange={setAddTeamTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Выбрать существующую</TabsTrigger>
              <TabsTrigger value="new">Создать новую</TabsTrigger>
            </TabsList>

            {/* Existing team tab */}
            <TabsContent value="existing" className="mt-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или тегу..."
                  value={teamSearch}
                  onChange={(e) => setTeamSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <ScrollArea className="h-48 rounded-md border">
                {teamsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Skeleton className="h-4 w-32" />
                  </div>
                ) : availableTeams.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      {allTeams.length === 0
                        ? 'Нет доступных команд. Создайте новую.'
                        : 'Все команды уже добавлены в турнир.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {availableTeams.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTeam(t)}
                        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                          selectedTeam?.id === t.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate font-medium">{t.name}</span>
                          {t.tag && (
                            <span
                              className={`flex-shrink-0 rounded px-1 py-0.5 font-mono text-xs ${
                                selectedTeam?.id === t.id
                                  ? 'bg-primary-foreground/20'
                                  : 'bg-muted'
                              }`}
                            >
                              {t.tag}
                            </span>
                          )}
                        </div>
                        {selectedTeam?.id === t.id && (
                          <ChevronRight className="h-4 w-4 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* New team tab */}
            <TabsContent value="new" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-team-name">Название *</Label>
                <Input
                  id="new-team-name"
                  placeholder="Название команды"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-team-tag">Тег</Label>
                <Input
                  id="new-team-tag"
                  placeholder="например: TSM"
                  value={newTeamTag}
                  onChange={(e) => setNewTeamTag(e.target.value)}
                  className="max-w-32 font-mono uppercase"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-team-desc">Описание</Label>
                <Textarea
                  id="new-team-desc"
                  placeholder="Краткое описание команды..."
                  value={newTeamDescription}
                  onChange={(e) => setNewTeamDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Seed input */}
          <div className="space-y-2">
            <Label htmlFor="seed-input" className="flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5" />
              Номер посева (seed)
            </Label>
            <Input
              id="seed-input"
              type="number"
              min={1}
              max={maxTeams}
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              className="max-w-24"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddingTeam(false)}
              disabled={addTeamLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleAddTeam} disabled={addTeamLoading}>
              {addTeamLoading ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Player Dialog ──────────────────────────────────────────────── */}
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Добавить игрока
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Имя игрока *</Label>
              <Input
                id="player-name"
                placeholder="Введите имя"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPlayer();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="player-role">Роль</Label>
              <Select value={playerRole} onValueChange={setPlayerRole}>
                <SelectTrigger id="player-role" className="w-full">
                  <SelectValue placeholder="Выберите роль" />
                </SelectTrigger>
                <SelectContent>
                  {PLAYER_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <span className="flex items-center gap-2">
                        <role.icon className="h-3.5 w-3.5" />
                        {role.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlayerDialogOpen(false)}
              disabled={addPlayerLoading}
            >
              Отмена
            </Button>
            <Button onClick={handleAddPlayer} disabled={addPlayerLoading}>
              {addPlayerLoading ? 'Добавление...' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
