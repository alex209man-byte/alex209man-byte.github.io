'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';
import type { TournamentFormat, TournamentStatus } from '@/lib/store';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  Trophy,
  Shield,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Settings,
  Target,
} from 'lucide-react';

const COVER_COLORS = [
  '#10b981', '#f59e0b', '#6366f1', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
  '#84cc16', '#14b8a6',
];

const SPORTS = [
  { value: 'Общий', label: 'Общий' },
  { value: 'Футбол', label: 'Футбол' },
  { value: 'Баскетбол', label: 'Баскетбол' },
  { value: 'Волейбол', label: 'Волейбол' },
  { value: 'Киберспорт', label: 'Киберспорт' },
  { value: 'Хоккей', label: 'Хоккей' },
  { value: 'Теннис', label: 'Теннис' },
];

const FORMAT_OPTIONS = [
  {
    value: 'single_elimination' as TournamentFormat,
    title: 'Олимпийская система',
    description: 'Проигравший выбывает',
    icon: Trophy,
  },
  {
    value: 'double_elimination' as TournamentFormat,
    title: 'Двойная олимпийская',
    description: 'Два шанса на победу',
    icon: Shield,
  },
  {
    value: 'round_robin' as TournamentFormat,
    title: 'Круговая система',
    description: 'Все играют со всеми',
    icon: RefreshCw,
  },
];

interface FormData {
  name: string;
  description: string;
  sport: string;
  coverColor: string;
  status: TournamentStatus;
  format: TournamentFormat;
  maxTeams: number;
  winsNeeded: number;
  pointsWin: number;
  pointsDraw: number;
  pointsLoss: number;
  startDate: string;
  endDate: string;
}

const STEP_TITLES = [
  { title: 'Основная информация', subtitle: 'Название, описание и оформление', icon: Sparkles },
  { title: 'Настройки турнира', subtitle: 'Формат и параметры', icon: Settings },
  { title: 'Очки и даты', subtitle: 'Система начисления и сроки', icon: Target },
];

export function TournamentCreateWizard() {
  const {
    setCurrentView,
    setSelectedTournamentId,
    setTournaments,
    setCurrentTournament,
  } = useAppStore();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>({
    name: '',
    description: '',
    sport: 'Общий',
    coverColor: COVER_COLORS[0],
    status: 'draft',
    format: 'single_elimination',
    maxTeams: 8,
    winsNeeded: 1,
    pointsWin: 3,
    pointsDraw: 1,
    pointsLoss: 0,
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  function updateField<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  // ---------- Validation ----------

  function validateStep1(): boolean {
    const newErrors: typeof errors = {};
    if (!form.name.trim()) {
      newErrors.name = 'Название турнира обязательно';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep2(): boolean {
    const newErrors: typeof errors = {};
    if (form.maxTeams < 2 || form.maxTeams > 64) {
      newErrors.maxTeams = 'Количество команд: от 2 до 64';
    }
    if (form.winsNeeded < 1 || form.winsNeeded > 5) {
      newErrors.winsNeeded = 'Побед: от 1 до 5';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function validateStep3(): boolean {
    const newErrors: typeof errors = {};
    if (form.startDate && form.endDate && form.startDate > form.endDate) {
      newErrors.endDate = 'Дата окончания не может быть раньше начала';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ---------- Navigation ----------

  function handleNext() {
    let valid = false;
    if (step === 1) valid = validateStep1();
    else if (step === 2) valid = validateStep2();
    else if (step === 3) valid = validateStep3();
    if (valid && step < 3) setStep(step + 1);
  }

  function handleBack() {
    if (step === 1) {
      setCurrentView('home');
    } else {
      setStep(step - 1);
      setErrors({});
    }
  }

  async function handleCreate() {
    if (!validateStep3()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || undefined,
          sport: form.sport,
          format: form.format,
          maxTeams: form.maxTeams,
          winsNeeded: form.winsNeeded,
          pointsWin: form.pointsWin,
          pointsDraw: form.pointsDraw,
          pointsLoss: form.pointsLoss,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          status: form.status,
          coverColor: form.coverColor,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка создания турнира');
      }

      const newTournament = await res.json();

      // Refresh tournaments list
      const listRes = await fetch('/api/tournaments');
      if (listRes.ok) {
        const allTournaments = await listRes.json();
        setTournaments(allTournaments);
      }

      // Fetch full tournament details
      const detailRes = await fetch(`/api/tournaments/${newTournament.id}`);
      let fullTournament = newTournament;
      if (detailRes.ok) {
        fullTournament = await detailRes.json();
      }

      setCurrentTournament(fullTournament);
      setSelectedTournamentId(newTournament.id);
      setCurrentView('tournament');
      toast.success('Турнир создан!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------- Progress ----------

  function renderProgress() {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEP_TITLES.map((s, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;
            const Icon = s.icon;
            return (
              <button
                type="button"
                key={stepNum}
                onClick={() => {
                  // Allow clicking on completed or current step
                  if (isCompleted) setStep(stepNum);
                }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-default
                  ${isActive ? 'text-primary' : isCompleted ? 'text-primary/70 hover:text-primary cursor-pointer' : 'text-muted-foreground'}`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors
                    ${isActive ? 'bg-primary text-primary-foreground' : isCompleted ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            );
          })}
        </div>
        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  // ---------- Step 1: Basic Info ----------

  function renderStep1() {
    return (
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" />
            Основная информация
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Введите название, описание и выберите оформление турнира
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0 space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="tournament-name">
              Название турнира <span className="text-destructive">*</span>
            </Label>
            <Input
              id="tournament-name"
              placeholder="Например: Кубок чемпионов 2025"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="tournament-desc">Описание</Label>
            <Textarea
              id="tournament-desc"
              placeholder="Расскажите о турнире..."
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Sport & Status row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Вид спорта</Label>
              <Select
                value={form.sport}
                onValueChange={(val) => updateField('sport', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Выберите спорт" />
                </SelectTrigger>
                <SelectContent>
                  {SPORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.status}
                onValueChange={(val) => updateField('status', val as TournamentStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="registration">Регистрация</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cover Color */}
          <div className="space-y-3">
            <Label>Цвет обложки</Label>
            <div className="flex flex-wrap gap-3">
              {COVER_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateField('coverColor', color)}
                  className={`w-9 h-9 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    form.coverColor === color
                      ? 'border-foreground ring-2 ring-ring ring-offset-2 scale-110'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                >
                  {form.coverColor === color && (
                    <Check className="w-4 h-4 mx-auto text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </div>
    );
  }

  // ---------- Step 2: Tournament Settings ----------

  function renderStep2() {
    return (
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Settings className="w-5 h-5 text-primary" />
            Настройки турнира
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Выберите формат и настройте параметры
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0 space-y-6">
          {/* Format selection as radio cards */}
          <div className="space-y-3">
            <Label>Формат турнира</Label>
            <RadioGroup
              value={form.format}
              onValueChange={(val) => updateField('format', val as TournamentFormat)}
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
            >
              {FORMAT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = form.format === opt.value;
                return (
                  <Label
                    key={opt.value}
                    htmlFor={`format-${opt.value}`}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-muted hover:bg-muted/50'
                    }`}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={`format-${opt.value}`}
                      className="sr-only"
                    />
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold leading-tight">{opt.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2">
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    )}
                  </Label>
                );
              })}
            </RadioGroup>
          </div>

          {/* Max teams & Wins needed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max-teams">Макс. команд</Label>
              <Input
                id="max-teams"
                type="number"
                min={2}
                max={64}
                value={form.maxTeams}
                onChange={(e) => updateField('maxTeams', Number(e.target.value))}
                className={errors.maxTeams ? 'border-destructive' : ''}
              />
              {errors.maxTeams && (
                <p className="text-sm text-destructive">{errors.maxTeams}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="wins-needed">Побед для выиграть матч</Label>
              <Input
                id="wins-needed"
                type="number"
                min={1}
                max={5}
                value={form.winsNeeded}
                onChange={(e) => updateField('winsNeeded', Number(e.target.value))}
                className={errors.winsNeeded ? 'border-destructive' : ''}
              />
              {errors.winsNeeded && (
                <p className="text-sm text-destructive">{errors.winsNeeded}</p>
              )}
            </div>
          </div>
        </CardContent>
      </div>
    );
  }

  // ---------- Step 3: Scoring & Dates ----------

  function renderStep3() {
    return (
      <div className="space-y-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="w-5 h-5 text-primary" />
            Очки и даты
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Настройте систему начисления очков и укажите сроки
          </p>
        </CardHeader>

        <CardContent className="px-0 pb-0 space-y-6">
          {/* Scoring */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              Начисление очков
            </Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="points-win" className="text-sm text-muted-foreground">
                  За победу
                </Label>
                <Input
                  id="points-win"
                  type="number"
                  min={0}
                  value={form.pointsWin}
                  onChange={(e) => updateField('pointsWin', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points-draw" className="text-sm text-muted-foreground">
                  За ничью
                </Label>
                <Input
                  id="points-draw"
                  type="number"
                  min={0}
                  value={form.pointsDraw}
                  onChange={(e) => updateField('pointsDraw', Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="points-loss" className="text-sm text-muted-foreground">
                  За поражение
                </Label>
                <Input
                  id="points-loss"
                  type="number"
                  min={0}
                  value={form.pointsLoss}
                  onChange={(e) => updateField('pointsLoss', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Даты проведения
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                  Дата начала
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField('startDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                  Дата окончания
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={form.endDate}
                  onChange={(e) => updateField('endDate', e.target.value)}
                  className={errors.endDate ? 'border-destructive' : ''}
                />
                {errors.endDate && (
                  <p className="text-sm text-destructive">{errors.endDate}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </div>
    );
  }

  // ---------- Render ----------

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
      <Card className="border-0 sm:border shadow-none sm:shadow-sm">
        <div className="p-6 sm:p-8">
          {/* Progress bar */}
          {renderProgress()}

          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'На главную' : 'Назад'}
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} className="gap-2">
                Далее
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Создать турнир
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
