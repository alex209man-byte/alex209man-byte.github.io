'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAppStore, type Tournament, type TournamentStatus, type TournamentFormat } from '@/lib/store';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy, Plus, Users, Swords, Calendar, Search,
  Filter, ChevronRight, Sparkles, Target, Medal, Zap
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ── Translation maps ──────────────────────────────────────────────
const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  registration: 'Регистрация',
  active: 'Активный',
  completed: 'Завершён',
  archived: 'Архив',
};

const formatLabels: Record<string, string> = {
  single_elimination: 'Олимпийская',
  double_elimination: 'Двойная олимпийская',
  round_robin: 'Круговая',
  swiss: 'Швейцарская',
};

const sportLabels: Record<string, string> = {
  Esports: 'Киберспорт',
  Football: 'Футбол',
  Basketball: 'Баскетбол',
  General: 'Общий',
};

// ── Status badge styles ───────────────────────────────────────────
const statusStyles: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  registration: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/40 dark:text-zinc-400',
};

// ── Status filter options ─────────────────────────────────────────
const statusFilters: { value: TournamentStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Все' },
  { value: 'draft', label: 'Черновик' },
  { value: 'registration', label: 'Регистрация' },
  { value: 'active', label: 'Активный' },
  { value: 'completed', label: 'Завершён' },
];

// ── Format filter options ─────────────────────────────────────────
const formatFilters: { value: TournamentFormat | 'all'; label: string }[] = [
  { value: 'all', label: 'Все форматы' },
  { value: 'single_elimination', label: 'Олимпийская' },
  { value: 'round_robin', label: 'Круговая' },
  { value: 'double_elimination', label: 'Двойная олимпийская' },
];

// ── Animation variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

// ── Helper: format a date range ──────────────────────────────────
function formatDateRange(start?: string | null, end?: string | null): string {
  if (!start && !end) return 'Дата не указана';
  const parts: string[] = [];
  if (start) {
    parts.push(format(new Date(start), 'd MMM yyyy', { locale: ru }));
  }
  if (end) {
    parts.push(format(new Date(end), 'd MMM yyyy', { locale: ru }));
  }
  return parts.join(' — ');
}

// ── Main Component ────────────────────────────────────────────────
export function TournamentList() {
  const {
    setCurrentView,
    setSelectedTournamentId,
    setTournaments,
    isLoading,
    setIsLoading,
  } = useAppStore();

  const [tournaments, setLocalTournaments] = useState<Tournament[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TournamentStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<TournamentFormat | 'all'>('all');

  // ── Fetch tournaments ──────────────────────────────────────────
  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tournaments');
      if (!res.ok) throw new Error('Failed to fetch');
      const data: Tournament[] = await res.json();
      setLocalTournaments(data);
      setTournaments(data);
    } catch {
      toast.error('Не удалось загрузить турниры');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setTournaments]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // ── Filtered list ──────────────────────────────────────────────
  const filtered = tournaments.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (formatFilter !== 'all' && t.format !== formatFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  // ── Stats ──────────────────────────────────────────────────────
  const totalCount = tournaments.length;
  const activeCount = tournaments.filter((t) => t.status === 'active').length;
  const completedCount = tournaments.filter((t) => t.status === 'completed').length;

  // ── Handlers ───────────────────────────────────────────────────
  function handleOpenTournament(id: string) {
    setSelectedTournamentId(id);
    setCurrentView('tournament');
  }

  // ── Loading skeleton ───────────────────────────────────────────
  if (isLoading && tournaments.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero skeleton */}
        <div className="mb-10 animate-pulse space-y-4">
          <div className="h-10 w-96 rounded-lg bg-muted" />
          <div className="h-5 w-80 rounded bg-muted" />
          <div className="h-10 w-48 rounded-lg bg-muted" />
        </div>
        {/* Stats skeleton */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted" />
          ))}
        </div>
        {/* Filter skeleton */}
        <div className="mb-6 flex gap-3">
          <div className="h-10 w-64 rounded-lg bg-muted" />
          <div className="h-10 w-48 rounded-lg bg-muted" />
        </div>
        {/* Cards skeleton */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Hero Section ──────────────────────────────────────── */}
      <section className="mb-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                  Управление турнирами
                </span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Создавайте, управляйте и отслеживайте спортивные турниры
              </p>
            </div>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 shadow-lg shadow-emerald-600/20"
              onClick={() => setCurrentView('create')}
            >
              <Plus className="size-5" />
              Создать турнир
            </Button>
          </div>
        </motion.div>

        {/* ── Stats Row ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <Trophy className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Всего турниров</p>
              <p className="text-2xl font-bold">{totalCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Zap className="size-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Активных</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <Medal className="size-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Завершённых</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Filter Bar ────────────────────────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center"
      >
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Поиск турнира..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {statusFilters.map((sf) => (
            <button
              key={sf.value}
              type="button"
              onClick={() => setStatusFilter(sf.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === sf.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Format filter select */}
        <Select
          value={formatFilter}
          onValueChange={(v) => setFormatFilter(v as TournamentFormat | 'all')}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <Filter className="text-muted-foreground size-4" />
            <SelectValue placeholder="Формат" />
          </SelectTrigger>
          <SelectContent>
            {formatFilters.map((ff) => (
              <SelectItem key={ff.value} value={ff.value}>
                {ff.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </motion.section>

      {/* ── Tournament Cards Grid ─────────────────────────────── */}
      {filtered.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filtered.map((tournament) => (
            <motion.div key={tournament.id} variants={cardVariants}>
              <Card className="group relative overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                {/* Color accent strip */}
                <div
                  className="absolute left-0 top-0 h-1.5 w-full"
                  style={{ backgroundColor: tournament.coverColor || '#10b981' }}
                />

                <CardHeader className="pb-2 pt-5">
                  <div className="flex flex-col gap-2">
                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[11px] font-medium">
                        {sportLabels[tournament.sport] || tournament.sport}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] font-medium">
                        {formatLabels[tournament.format] || tournament.format}
                      </Badge>
                    </div>
                    {/* Tournament name */}
                    <h3 className="line-clamp-2 text-base font-semibold leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {tournament.name}
                    </h3>
                    {/* Status badge */}
                    <span
                      className={`inline-flex w-fit items-center rounded-md border border-transparent px-2 py-0.5 text-xs font-medium ${statusStyles[tournament.status] || ''}`}
                    >
                      {statusLabels[tournament.status] || tournament.status}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                  {/* Meta info */}
                  <div className="text-muted-foreground flex flex-col gap-1.5 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="size-3.5 shrink-0" />
                      <span>
                        {tournament._count?.teams ?? 0} / {tournament.maxTeams} команд
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Swords className="size-3.5 shrink-0" />
                      <span>
                        {tournament._count?.matches ?? 0} матчей
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 shrink-0" />
                      <span className="line-clamp-1">
                        {formatDateRange(tournament.startDate, tournament.endDate)}
                      </span>
                    </div>
                  </div>

                  {/* Action button */}
                  <Button
                    variant="ghost"
                    className="mt-1 w-full justify-end gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-900/20"
                    onClick={() => handleOpenTournament(tournament.id)}
                  >
                    Открыть
                    <ChevronRight className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* ── Empty State ─────────────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/30 py-20"
        >
          <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <Sparkles className="size-10 text-emerald-500 dark:text-emerald-400" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">
            {searchQuery || statusFilter !== 'all' || formatFilter !== 'all'
              ? 'Ничего не найдено'
              : 'Создайте первый турнир'}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm text-center text-sm">
            {searchQuery || statusFilter !== 'all' || formatFilter !== 'all'
              ? 'Попробуйте изменить параметры поиска или фильтры'
              : 'Начните с создания турнира, чтобы управлять командами и отслеживать результаты'}
          </p>
          {!(searchQuery || statusFilter !== 'all' || formatFilter !== 'all') && (
            <Button
              onClick={() => setCurrentView('create')}
              className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
            >
              <Plus className="size-4" />
              Создать турнир
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}
