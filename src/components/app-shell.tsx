'use client';

import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load view components
const TournamentList = lazy(
  () => import('@/components/tournament/tournament-list').then(m => ({ default: m.TournamentList }))
);
const TournamentCreateWizard = lazy(
  () => import('@/components/tournament/create-wizard').then(m => ({ default: m.TournamentCreateWizard }))
);
const TournamentDetail = lazy(
  () => import('@/components/tournament/tournament-detail').then(m => ({ default: m.TournamentDetail }))
);
const TeamManager = lazy(
  () => import('@/components/tournament/team-manager').then(m => ({ default: m.TeamManager }))
);

function ViewSkeleton() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

const viewVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function ViewRenderer() {
  const { currentView } = useAppStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentView}
        variants={viewVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-1"
      >
        <Suspense fallback={<ViewSkeleton />}>
          {currentView === 'home' && <TournamentList />}
          {currentView === 'create' && <TournamentCreateWizard />}
          {currentView === 'tournament' && <TournamentDetail />}
          {currentView === 'manage-teams' && <TeamManager />}
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

export function AppShell() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ViewRenderer />
      </main>
      <Footer />
    </div>
  );
}
