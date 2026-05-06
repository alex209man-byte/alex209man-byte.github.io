'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Sun,
  Moon,
  Menu,
  Plus,
  Home,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { useAppStore } from '@/lib/store';
import { cn } from '@/lib/utils';

function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useState(() => {
    setMounted(true);
  });

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="size-9" disabled>
        <Sun className="size-4" />
        <span className="sr-only">Переключить тему</span>
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Светлая тема' : 'Тёмная тема'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0, scale: 0 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: 90, opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="size-4 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: 90, opacity: 0, scale: 0 }}
            animate={{ rotate: 0, opacity: 1, scale: 1 }}
            exit={{ rotate: -90, opacity: 0, scale: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="size-4 text-emerald-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}

function DesktopNav() {
  const { currentView, setCurrentView, setSelectedTournamentId } =
    useAppStore();

  const goHome = () => {
    setCurrentView('home');
    setSelectedTournamentId(null);
  };

  const goCreate = () => {
    setCurrentView('create');
  };

  return (
    <nav className="hidden md:flex items-center gap-1">
      <Button
        variant={currentView === 'home' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={goHome}
        className="gap-1.5 text-sm"
      >
        <Home className="size-3.5" />
        Все турниры
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={goCreate}
        className="gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
      >
        <Plus className="size-3.5" />
        Новый турнир
      </Button>
    </nav>
  );
}

function MobileNav() {
  const { currentView, setCurrentView, setSelectedTournamentId } =
    useAppStore();
  const [open, setOpen] = useState(false);

  const goHome = () => {
    setCurrentView('home');
    setSelectedTournamentId(null);
    setOpen(false);
  };

  const goCreate = () => {
    setCurrentView('create');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden size-9">
          <Menu className="size-5" />
          <span className="sr-only">Меню</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Trophy className="size-5" />
            ТурнирХаб
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 mt-4 px-4">
          <SheetClose asChild>
            <Button
              variant={currentView === 'home' ? 'secondary' : 'ghost'}
              className="justify-start gap-2 w-full"
              onClick={goHome}
            >
              <Home className="size-4" />
              Все турниры
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button
              variant="ghost"
              className="justify-start gap-2 w-full text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
              onClick={goCreate}
            >
              <Plus className="size-4" />
              Новый турнир
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function BackButton() {
  const { currentView, setCurrentView, setSelectedTournamentId, currentTournament } =
    useAppStore();

  const isDetailView =
    currentView === 'tournament' || currentView === 'manage-teams' || currentView === 'create';

  if (!isDetailView) return null;

  const goBack = () => {
    if (currentView === 'tournament' || currentView === 'manage-teams') {
      setSelectedTournamentId(null);
    }
    setCurrentView('home');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={goBack}
        className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="size-3.5" />
        <span className="hidden sm:inline">
          {currentView === 'create'
            ? 'Назад к турнирам'
            : currentTournament?.name
              ? `К турниру`
              : 'Назад'}
        </span>
        <span className="sm:hidden">Назад</span>
      </Button>
    </motion.div>
  );
}

export function Header() {
  const { currentView } = useAppStore();
  const isDetailView =
    currentView === 'tournament' || currentView === 'manage-teams' || currentView === 'create';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60',
        'transition-shadow duration-200',
      )}
    >
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <MobileNav />

          {isDetailView && (
            <div className="flex items-center gap-2">
              <BackButton />
              <span className="hidden sm:block h-4 w-px bg-border" />
            </div>
          )}

          <button
            onClick={() => {
              const { setCurrentView, setSelectedTournamentId } =
                useAppStore.getState();
              setCurrentView('home');
              setSelectedTournamentId(null);
            }}
            className="flex items-center gap-2 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity"
          >
            <Trophy className="size-5 text-emerald-500" />
            <span className="bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-emerald-300">
              ТурнирХаб
            </span>
          </button>
        </div>

        {/* Center nav - desktop */}
        {!isDetailView && <DesktopNav />}

        {/* Right section */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
