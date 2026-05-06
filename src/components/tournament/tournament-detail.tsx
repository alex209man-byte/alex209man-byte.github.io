'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore, type Tournament, type Match, type Standing, type TournamentTeam } from '@/lib/store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Trophy, Users, Calendar, Download, Play, CheckCircle, Trash2,
  Edit, ChevronDown, ChevronUp, Medal, Swords, MapPin, Clock,
  ArrowUp, ArrowDown,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Черновик', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  registration: { label: 'Регистрация', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  active: { label: 'Активный', className: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  completed: { label: 'Завершён', className: 'bg-amber-100 text-amber-700 border-amber-300' },
  archived: { label: 'Архив', className: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const matchStatusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Ожидание', className: 'bg-gray-100 text-gray-600' },
  live: { label: 'В прямом эфире', className: 'bg-red-100 text-red-700 animate-pulse' },
  completed: { label: 'Завершён', className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Отменён', className: 'bg-gray-200 text-gray-500' },
};

const formatConfig: Record<string, string> = {
  single_elimination: 'Плей-офф',
  double_elimination: 'Двойной плей-офф',
  round_robin: 'Круговая система',
};

function getRoundNames(teamCount: number): string[] {
  const rounds = Math.ceil(Math.log2(teamCount));
  if (teamCount <= 4) return ['Полуфинал', 'Финал'];
  if (teamCount <= 8) return ['Четвертьфинал', 'Полуфинал', 'Финал'];
  if (teamCount <= 16) return ['1/8 финала', 'Четвертьфинал', 'Полуфинал', 'Финал'];
  // generic fallback
  const names: string[] = [];
  for (let i = 0; i < rounds; i++) {
    if (i === rounds - 1) names.push('Финал');
    else if (i === rounds - 2) names.push('Полуфинал');
    else if (i === rounds - 3) names.push('Четвертьфинал');
    else names.push(`Раунд ${i + 1}`);
  }
  return names;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ── Component ────────────────────────────────────────────────────────────

export function TournamentDetail() {
  const {
    selectedTournamentId, currentTournament, setCurrentTournament,
    isLoading, setIsLoading, tournamentTab, setTournamentTab,
    setCurrentView,
  } = useAppStore();

  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [score1, setScore1] = useState(0);
  const [score2, setScore2] = useState(0);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());

  // ── Fetch tournament on mount / id change ──
  const fetchTournament = useCallback(async () => {
    if (!selectedTournamentId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`);
      if (!res.ok) {
        toast.error('Не удалось загрузить турнир');
        setCurrentView('home');
        return;
      }
      const data = await res.json();
      setCurrentTournament(data);
    } catch {
      toast.error('Ошибка загрузки турнира');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTournamentId, setCurrentTournament, setIsLoading, setCurrentView]);

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  // ── Actions ──
  const handleStartTournament = async () => {
    if (!selectedTournamentId) return;
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/start`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Не удалось начать турнир');
        return;
      }
      toast.success('Турнир успешно запущен!');
      fetchTournament();
    } catch {
      toast.error('Ошибка запуска турнира');
    }
  };

  const handleCompleteTournament = async () => {
    if (!selectedTournamentId) return;
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/complete`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Не удалось завершить турнир');
        return;
      }
      toast.success('Турнир завершён!');
      fetchTournament();
    } catch {
      toast.error('Ошибка завершения турнира');
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournamentId) return;
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Не удалось удалить турнир');
        return;
      }
      toast.success('Турнир удалён');
      setCurrentTournament(null);
      setCurrentView('home');
    } catch {
      toast.error('Ошибка удаления турнира');
    }
  };

  const handleExportCsv = () => {
    if (!selectedTournamentId) return;
    window.open(`/api/tournaments/${selectedTournamentId}/export/csv`, '_blank');
    toast.success('CSV файл скачивается...');
  };

  const openScoreDialog = (match: Match) => {
    setEditingMatch(match);
    setScore1(match.score1);
    setScore2(match.score2);
    setScoreDialogOpen(true);
  };

  const saveScore = async () => {
    if (!editingMatch) return;
    try {
      const res = await fetch(`/api/matches/${editingMatch.id}/score`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score1, score2, status: 'completed' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Не удалось сохранить результат');
        return;
      }
      toast.success('Результат сохранён');
      setScoreDialogOpen(false);
      setEditingMatch(null);
      fetchTournament();
    } catch {
      toast.error('Ошибка сохранения результата');
    }
  };

  const toggleRound = (round: number) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev);
      if (next.has(round)) next.delete(round);
      else next.add(round);
      return next;
    });
  };

  // ── Loading skeleton ──
  if (isLoading || !currentTournament) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  const t = currentTournament;
  const teams = t.teams || [];
  const matches = t.matches || [];
  const standings = t.standings || [];

  const completedMatchesCount = matches.filter((m) => m.status === 'completed').length;
  const progressPercent = matches.length > 0 ? (completedMatchesCount / matches.length) * 100 : 0;

  // ── Bracket helpers ──
  const bracketMatches = matches.filter((m) => m.bracket === 'winners' || m.bracket === 'main' || m.bracket === '');
  const losersMatches = matches.filter((m) => m.bracket === 'losers');
  const maxRound = bracketMatches.length > 0 ? Math.max(...bracketMatches.map((m) => m.round)) : 0;
  const roundNames = getRoundNames(teams.length || 8);

  // Group bracket matches by round
  const roundsMap = new Map<number, Match[]>();
  for (const m of bracketMatches) {
    const arr = roundsMap.get(m.round) || [];
    arr.push(m);
    roundsMap.set(m.round, arr);
  }
  const rounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);

  // Group round-robin matches by round
  const rrRoundsMap = new Map<number, Match[]>();
  for (const m of matches) {
    const arr = rrRoundsMap.get(m.round) || [];
    arr.push(m);
    rrRoundsMap.set(m.round, arr);
  }
  const rrRounds = Array.from(rrRoundsMap.keys()).sort((a, b) => a - b);

  // Losers bracket rounds
  const losersRoundsMap = new Map<number, Match[]>();
  for (const m of losersMatches) {
    const arr = losersRoundsMap.get(m.round) || [];
    arr.push(m);
    losersRoundsMap.set(m.round, arr);
  }
  const losersRounds = Array.from(losersRoundsMap.keys()).sort((a, b) => a - b);

  const getTeamName = (match: Match, slot: 1 | 2) => {
    if (slot === 1) return match.team1?.name || 'TBD';
    return match.team2?.name || 'TBD';
  };

  const getTeamNameById = (teamId?: string) => {
    if (!teamId) return 'TBD';
    const tt = teams.find((t2) => t2.teamId === teamId);
    return tt?.team?.name || teamId.slice(0, 6);
  };

  // ── Render ──
  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-3 h-10 rounded-sm shrink-0"
              style={{ backgroundColor: t.coverColor || '#6366f1' }}
            />
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{t.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={statusConfig[t.status]?.className}>
              {statusConfig[t.status]?.label || t.status}
            </Badge>
            <Badge variant="secondary">
              <Swords className="size-3 mr-1" />
              {formatConfig[t.format] || t.format}
            </Badge>
            <Badge variant="outline">
              {t.sport}
            </Badge>
          </div>
        </div>

        {t.description && (
          <p className="text-muted-foreground text-sm max-w-2xl">{t.description}</p>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {t.status === 'registration' && (
            <Button onClick={handleStartTournament} className="gap-2">
              <Play className="size-4" />
              Начать турнир
            </Button>
          )}
          {t.status === 'active' && (
            <Button onClick={handleCompleteTournament} variant="outline" className="gap-2">
              <CheckCircle className="size-4" />
              Завершить
            </Button>
          )}
          {(t.status === 'completed' || t.status === 'active') && (
            <Button onClick={handleExportCsv} variant="outline" className="gap-2">
              <Download className="size-4" />
              Экспорт CSV
            </Button>
          )}
          {(t.status === 'draft' || t.status === 'registration') && (
            <Button onClick={handleDeleteTournament} variant="destructive" className="gap-2">
              <Trash2 className="size-4" />
              Удалить
            </Button>
          )}
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="size-3.5" />Команды
            </div>
            <div className="text-xl font-semibold">{teams.length}{t.maxTeams ? ` / ${t.maxTeams}` : ''}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Swords className="size-3.5" />Матчи
            </div>
            <div className="text-xl font-semibold">{completedMatchesCount} / {matches.length}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="size-3.5" />Начало
            </div>
            <div className="text-sm font-medium">{formatDate(t.startDate)}</div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Trophy className="size-3.5" />Прогресс
            </div>
            <div className="text-sm font-medium">{Math.round(progressPercent)}%</div>
            <Progress value={progressPercent} className="mt-1 h-1.5" />
          </Card>
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <Tabs value={tournamentTab} onValueChange={(v) => setTournamentTab(v as typeof tournamentTab)}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="bracket" className="gap-1.5">
            <Trophy className="size-3.5" /> Сетка
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-1.5">
            <Users className="size-3.5" /> Команды
          </TabsTrigger>
          <TabsTrigger value="standings" className="gap-1.5">
            <Medal className="size-3.5" /> Таблица
          </TabsTrigger>
          <TabsTrigger value="matches" className="gap-1.5">
            <Swords className="size-3.5" /> Матчи
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5">
            <Edit className="size-3.5" /> Настройки
          </TabsTrigger>
        </TabsList>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1 — BRACKET
           ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="bracket">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-2"
            >
              {t.format === 'single_elimination' && (
                <SingleEliminationBracket
                  rounds={rounds}
                  roundsMap={roundsMap}
                  roundNames={roundNames}
                  maxRound={maxRound}
                  getTeamName={getTeamName}
                  onMatchClick={openScoreDialog}
                  tournamentStatus={t.status}
                />
              )}

              {t.format === 'round_robin' && (
                <RoundRobinView
                  rrRounds={rrRounds}
                  rrRoundsMap={rrRoundsMap}
                  expandedRounds={expandedRounds}
                  toggleRound={toggleRound}
                  getTeamNameById={getTeamNameById}
                  onMatchClick={openScoreDialog}
                  tournamentStatus={t.status}
                />
              )}

              {t.format === 'double_elimination' && (
                <DoubleEliminationView
                  rounds={rounds}
                  roundsMap={roundsMap}
                  roundNames={roundNames}
                  maxRound={maxRound}
                  losersRounds={losersRounds}
                  losersRoundsMap={losersRoundsMap}
                  getTeamName={getTeamName}
                  onMatchClick={openScoreDialog}
                  tournamentStatus={t.status}
                />
              )}

              {matches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Trophy className="size-12 mb-3 opacity-30" />
                  <p className="text-sm">Сетка появится после начала турнира</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2 — TEAMS
           ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="teams">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2 space-y-4"
          >
            {(t.status === 'draft' || t.status === 'registration') && (
              <Button
                onClick={() => setCurrentView('manage-teams')}
                className="gap-2"
              >
                <Users className="size-4" />
                Управление командами
              </Button>
            )}

            {teams.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="size-12 mb-3 opacity-30" />
                <p className="text-sm">Команды ещё не добавлены</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((tt, idx) => (
                  <motion.div
                    key={tt.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm shrink-0">
                          {tt.seed || idx + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold truncate">
                            {tt.team?.name || 'Без названия'}
                          </h3>
                          {tt.team?.tag && (
                            <Badge variant="outline" className="text-xs mt-0.5">
                              [{tt.team.tag}]
                            </Badge>
                          )}
                          {tt.team?.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {tt.team.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Users className="size-3" />
                            {tt.players?.length || 0} игроков
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3 — STANDINGS
           ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="standings">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2"
          >
            {standings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Medal className="size-12 mb-3 opacity-30" />
                <p className="text-sm">Таблица появится после начала турнира</p>
              </div>
            ) : (
              <Card>
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Команда</TableHead>
                        <TableHead className="text-center">И</TableHead>
                        <TableHead className="text-center">В</TableHead>
                        <TableHead className="text-center">Н</TableHead>
                        <TableHead className="text-center">П</TableHead>
                        <TableHead className="text-center">ЗБ</TableHead>
                        <TableHead className="text-center">ПБ</TableHead>
                        <TableHead className="text-center">Р</TableHead>
                        <TableHead className="text-center font-bold">О</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {standings.map((s, idx) => {
                        const diff = s.pointsFor - s.pointsAgainst;
                        const rankIcon =
                          s.rank === 1 ? '🥇' :
                          s.rank === 2 ? '🥈' :
                          s.rank === 3 ? '🥉' : null;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">
                              <span className="flex items-center gap-1">
                                {rankIcon || s.rank}
                              </span>
                            </TableCell>
                            <TableCell className="font-semibold">{s.teamName}</TableCell>
                            <TableCell className="text-center">{s.played}</TableCell>
                            <TableCell className="text-center">{s.wins}</TableCell>
                            <TableCell className="text-center">{s.draws}</TableCell>
                            <TableCell className="text-center">{s.losses}</TableCell>
                            <TableCell className="text-center">{s.pointsFor}</TableCell>
                            <TableCell className="text-center">{s.pointsAgainst}</TableCell>
                            <TableCell className="text-center">
                              <span
                                className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                                  diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-muted-foreground'
                                }`}
                              >
                                {diff > 0 && <ArrowUp className="size-3" />}
                                {diff < 0 && <ArrowDown className="size-3" />}
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </TableCell>
                            <TableCell className="text-center font-bold">{s.points}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4 — MATCHES
           ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="matches">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2"
          >
            {matches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Swords className="size-12 mb-3 opacity-30" />
                <p className="text-sm">Матчи появятся после начала турнира</p>
              </div>
            ) : (
              <Card>
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Раунд</TableHead>
                        <TableHead>Команда 1</TableHead>
                        <TableHead className="text-center w-24">Счёт</TableHead>
                        <TableHead>Команда 2</TableHead>
                        <TableHead className="w-28">Статус</TableHead>
                        <TableHead className="w-20">Площадка</TableHead>
                        <TableHead className="w-28">Расписание</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matches.map((m) => {
                        const canClick = m.status === 'pending' || m.status === 'live';
                        return (
                          <TableRow
                            key={m.id}
                            className={canClick ? 'cursor-pointer' : ''}
                            onClick={() => canClick && openScoreDialog(m)}
                          >
                            <TableCell className="text-muted-foreground">
                              {t.format === 'round_robin'
                                ? `Тур ${m.round}`
                                : roundNames[m.round - 1] || `Р${m.round}`}
                            </TableCell>
                            <TableCell
                              className={`font-medium ${
                                m.status === 'completed' && m.score1 > m.score2
                                  ? 'text-emerald-600'
                                  : ''
                              }`}
                            >
                              {getTeamName(m, 1)}
                            </TableCell>
                            <TableCell className="text-center font-mono font-semibold">
                              {m.status === 'completed' ? (
                                <span>
                                  {m.score1} : {m.score2}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">— : —</span>
                              )}
                            </TableCell>
                            <TableCell
                              className={`font-medium ${
                                m.status === 'completed' && m.score2 > m.score1
                                  ? 'text-emerald-600'
                                  : ''
                              }`}
                            >
                              {getTeamName(m, 2)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={matchStatusConfig[m.status]?.className}
                              >
                                {matchStatusConfig[m.status]?.label || m.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {m.venue ? (
                                <span className="flex items-center gap-1">
                                  <MapPin className="size-3" /> {m.venue}
                                </span>
                              ) : '—'}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-xs">
                              {m.scheduledAt ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="size-3" />
                                  {new Date(m.scheduledAt).toLocaleDateString('ru-RU', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                  })}
                                </span>
                              ) : '—'}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </Card>
            )}
          </motion.div>
        </TabsContent>

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5 — SETTINGS
           ══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="settings">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-2"
          >
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Настройки турнира</h2>
                {(t.status === 'draft' || t.status === 'registration') && (
                  <Badge variant="outline" className="text-xs">Редактируемый</Badge>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Название</Label>
                  <p className="font-medium">{t.name}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Вид спорта</Label>
                  <p className="font-medium">{t.sport}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Формат</Label>
                  <p className="font-medium">{formatConfig[t.format] || t.format}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Макс. команд</Label>
                  <p className="font-medium">{t.maxTeams}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Побед для выхода</Label>
                  <p className="font-medium">{t.winsNeeded}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs">Очки (В / Н / П)</Label>
                  <p className="font-medium">
                    {t.pointsWin} / {t.pointsDraw} / {t.pointsLoss}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Calendar className="size-3" /> Дата начала
                  </Label>
                  <p className="font-medium">{formatDate(t.startDate)}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-xs flex items-center gap-1">
                    <Calendar className="size-3" /> Дата окончания
                  </Label>
                  <p className="font-medium">{formatDate(t.endDate)}</p>
                </div>
              </div>

              {t.description && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <Label className="text-muted-foreground text-xs">Описание</Label>
                    <p className="text-sm">{t.description}</p>
                  </div>
                </>
              )}

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs text-muted-foreground">
                <div>
                  <span className="block">ID</span>
                  <span className="font-mono text-[11px]">{t.id}</span>
                </div>
                <div>
                  <span className="block">Создан</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
                <div>
                  <span className="block">Обновлён</span>
                  <span>{formatDate(t.updatedAt)}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* ── Score Dialog ── */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ввод результата</DialogTitle>
          </DialogHeader>
          {editingMatch && (
            <div className="space-y-4 py-2">
              <div className="flex items-center justify-center gap-4 text-lg font-semibold">
                <span className="text-right flex-1 truncate">
                  {getTeamName(editingMatch, 1)}
                </span>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    value={score1}
                    onChange={(e) => setScore1(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-xl font-bold"
                  />
                  <span className="text-muted-foreground text-xl">:</span>
                  <Input
                    type="number"
                    min={0}
                    value={score2}
                    onChange={(e) => setScore2(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-20 text-center text-xl font-bold"
                  />
                </div>
                <span className="text-left flex-1 truncate">
                  {getTeamName(editingMatch, 2)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setScoreDialogOpen(false)}>
              Отмена
            </Button>
            <Button onClick={saveScore} className="gap-2">
              <CheckCircle className="size-4" />
              Сохранить результат
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

/* Single Elimination Bracket */
function SingleEliminationBracket({
  rounds, roundsMap, roundNames, maxRound, getTeamName, onMatchClick, tournamentStatus,
}: {
  rounds: number[];
  roundsMap: Map<number, Match[]>;
  roundNames: string[];
  maxRound: number;
  getTeamName: (m: Match, slot: 1 | 2) => string;
  onMatchClick: (m: Match) => void;
  tournamentStatus: string;
}) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-6 items-stretch min-w-[600px] pb-4 px-2">
        {rounds.map((round, rIdx) => {
          const matches = roundsMap.get(round) || [];
          const isFinal = round === maxRound;
          const roundLabel = roundNames[rIdx] || `Раунд ${round + 1}`;
          const matchSpacing = Math.pow(2, rounds.length - 1 - rIdx);

          return (
            <div key={round} className="flex flex-col items-center flex-shrink-0">
              <div className="text-xs font-semibold text-muted-foreground mb-3 px-2 py-1 bg-muted rounded-md">
                {roundLabel}
              </div>
              <div
                className="flex flex-col justify-around flex-1 relative"
                style={{ gap: '0', height: matches.length > 1 ? `${matches.length * matchSpacing * 60}px` : 'auto' }}
              >
                {matches.map((m) => {
                  const canClick = (m.status === 'pending' || m.status === 'live') && tournamentStatus === 'active';
                  return (
                    <BracketMatchCard
                      key={m.id}
                      match={m}
                      getTeamName={getTeamName}
                      isFinal={isFinal}
                      canClick={canClick}
                      onClick={() => canClick && onMatchClick(m)}
                      style={{
                        marginTop: rIdx === 0 ? '0' : `${matchSpacing * 30 - 30}px`,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/* Bracket Match Card */
function BracketMatchCard({
  match, getTeamName, isFinal, canClick, onClick, style,
}: {
  match: Match;
  getTeamName: (m: Match, slot: 1 | 2) => string;
  isFinal: boolean;
  canClick: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  const isCompleted = match.status === 'completed';
  const isPending = match.status === 'pending';
  const hasTeams = match.team1?.name && match.team2?.name;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-lg border overflow-hidden transition-all shrink-0
        ${isFinal ? 'border-amber-400 shadow-amber-100 shadow-md ring-2 ring-amber-200' : 'border-border'}
        ${canClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm' : ''}
        ${isCompleted ? 'bg-emerald-50/60' : ''}
        ${isPending && !hasTeams ? 'border-dashed opacity-70' : ''}
      `}
      style={{ width: isFinal ? 220 : 180, ...style }}
    >
      <div className={`flex items-center justify-between px-3 py-1.5 text-sm border-b ${isCompleted && match.score1 > match.score2 ? 'bg-emerald-100/50' : ''}`}>
        <span className={`truncate ${isCompleted && match.score1 > match.score2 ? 'font-bold text-emerald-700' : 'font-medium'}`}>
          {getTeamName(match, 1)}
        </span>
        {isCompleted && (
          <span className="font-bold text-xs ml-2">{match.score1}</span>
        )}
      </div>
      <div className={`flex items-center justify-between px-3 py-1.5 text-sm ${isCompleted && match.score2 > match.score1 ? 'bg-emerald-100/50' : ''}`}>
        <span className={`truncate ${isCompleted && match.score2 > match.score1 ? 'font-bold text-emerald-700' : 'font-medium'}`}>
          {getTeamName(match, 2)}
        </span>
        {isCompleted && (
          <span className="font-bold text-xs ml-2">{match.score2}</span>
        )}
      </div>
    </div>
  );
}

/* Round Robin View */
function RoundRobinView({
  rrRounds, rrRoundsMap, expandedRounds, toggleRound, getTeamNameById, onMatchClick, tournamentStatus,
}: {
  rrRounds: number[];
  rrRoundsMap: Map<number, Match[]>;
  expandedRounds: Set<number>;
  toggleRound: (round: number) => void;
  getTeamNameById: (teamId?: string) => string;
  onMatchClick: (m: Match) => void;
  tournamentStatus: string;
}) {
  return (
    <div className="space-y-3">
      {rrRounds.map((round) => {
        const matches = rrRoundsMap.get(round) || [];
        const isExpanded = expandedRounds.has(round);
        return (
          <Card key={round} className="overflow-hidden">
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              onClick={() => toggleRound(round)}
            >
              <span className="font-semibold text-sm">Тур {round}</span>
              <span className="text-muted-foreground text-xs">
                {matches.length} матчей
              </span>
              {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            </button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Separator />
                  <Table>
                    <TableBody>
                      {matches.map((m) => {
                        const canClick = (m.status === 'pending' || m.status === 'live') && tournamentStatus === 'active';
                        return (
                          <TableRow
                            key={m.id}
                            className={canClick ? 'cursor-pointer' : ''}
                            onClick={() => canClick && onMatchClick(m)}
                          >
                            <TableCell className="font-medium">
                              {getTeamNameById(m.team1Id)}
                            </TableCell>
                            <TableCell className="text-center font-mono font-semibold">
                              {m.status === 'completed'
                                ? `${m.score1} : ${m.score2}`
                                : '— : —'}
                            </TableCell>
                            <TableCell className="font-medium text-right">
                              {getTeamNameById(m.team2Id)}
                            </TableCell>
                            <TableCell className="w-24">
                              <Badge
                                variant="secondary"
                                className={matchStatusConfig[m.status]?.className}
                              >
                                {matchStatusConfig[m.status]?.label || m.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}

/* Double Elimination View */
function DoubleEliminationView({
  rounds, roundsMap, roundNames, maxRound,
  losersRounds, losersRoundsMap,
  getTeamName, onMatchClick, tournamentStatus,
}: {
  rounds: number[];
  roundsMap: Map<number, Match[]>;
  roundNames: string[];
  maxRound: number;
  losersRounds: number[];
  losersRoundsMap: Map<number, Match[]>;
  getTeamName: (m: Match, slot: 1 | 2) => string;
  onMatchClick: (m: Match) => void;
  tournamentStatus: string;
}) {
  return (
    <div className="space-y-8">
      {/* Winners bracket */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          Победители
        </h3>
        <ScrollArea className="w-full">
          <div className="flex gap-6 items-stretch min-w-[600px] pb-4 px-2">
            {rounds.map((round, rIdx) => {
              const matches = roundsMap.get(round) || [];
              const isFinal = round === maxRound;
              const label = roundNames[rIdx] || `Раунд ${round + 1}`;
              const matchSpacing = Math.pow(2, rounds.length - 1 - rIdx);

              return (
                <div key={round} className="flex flex-col items-center flex-shrink-0">
                  <div className="text-xs font-semibold text-muted-foreground mb-3 px-2 py-1 bg-amber-50 text-amber-700 rounded-md border border-amber-200">
                    {label}
                  </div>
                  <div
                    className="flex flex-col justify-around flex-1"
                    style={{
                      gap: '0',
                      height: matches.length > 1 ? `${matches.length * matchSpacing * 60}px` : 'auto',
                    }}
                  >
                    {matches.map((m) => {
                      const canClick = (m.status === 'pending' || m.status === 'live') && tournamentStatus === 'active';
                      return (
                        <BracketMatchCard
                          key={m.id}
                          match={m}
                          getTeamName={getTeamName}
                          isFinal={isFinal}
                          canClick={canClick}
                          onClick={() => canClick && onMatchClick(m)}
                          style={{
                            marginTop: rIdx === 0 ? '0' : `${matchSpacing * 30 - 30}px`,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Losers bracket */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
          <ArrowDown className="size-4 text-red-400" />
          Проигравшие
        </h3>
        {losersRounds.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Матчи в нижней сетке появятся по мере проигрыша команд
          </p>
        ) : (
          <ScrollArea className="w-full">
            <div className="flex gap-6 items-stretch min-w-[600px] pb-4 px-2">
              {losersRounds.map((round, rIdx) => {
                const matches = losersRoundsMap.get(round) || [];
                const matchSpacing = Math.pow(2, Math.max(losersRounds.length - 1 - rIdx, 0));
                return (
                  <div key={round} className="flex flex-col items-center flex-shrink-0">
                    <div className="text-xs font-semibold text-muted-foreground mb-3 px-2 py-1 bg-red-50 text-red-600 rounded-md border border-red-200">
                      Раунд {rIdx + 1}
                    </div>
                    <div
                      className="flex flex-col justify-around flex-1"
                      style={{
                        gap: '0',
                        height: matches.length > 1 ? `${matches.length * matchSpacing * 60}px` : 'auto',
                      }}
                    >
                      {matches.map((m) => {
                        const canClick = (m.status === 'pending' || m.status === 'live') && tournamentStatus === 'active';
                        return (
                          <BracketMatchCard
                            key={m.id}
                            match={m}
                            getTeamName={getTeamName}
                            isFinal={false}
                            canClick={canClick}
                            onClick={() => canClick && onMatchClick(m)}
                            style={{
                              marginTop: rIdx === 0 ? '0' : `${matchSpacing * 30 - 30}px`,
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
