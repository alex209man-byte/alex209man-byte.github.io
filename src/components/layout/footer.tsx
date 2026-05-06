'use client';

import { Trophy } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-emerald-800/30">
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-8">
          {/* Top section */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & copyright */}
            <div className="flex flex-col items-center md:items-start gap-2">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="size-5 text-emerald-400" />
                <span className="font-bold text-lg tracking-tight">
                  ТурнирХаб
                </span>
              </div>
              <p className="text-emerald-300/60 text-sm">
                &copy; {new Date().getFullYear()} ТурнирХаб. Все права защищены.
              </p>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              <a
                href="#"
                className="text-emerald-200/70 text-sm hover:text-white transition-colors duration-200"
              >
                О платформе
              </a>
              <a
                href="#"
                className="text-emerald-200/70 text-sm hover:text-white transition-colors duration-200"
              >
                Условия использования
              </a>
              <a
                href="#"
                className="text-emerald-200/70 text-sm hover:text-white transition-colors duration-200"
              >
                Контакты
              </a>
            </nav>
          </div>

          {/* Bottom divider & note */}
          <div className="mt-6 pt-4 border-t border-emerald-800/30">
            <p className="text-center text-emerald-400/40 text-xs">
              Платформа для организации и управления спортивными турнирами
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
