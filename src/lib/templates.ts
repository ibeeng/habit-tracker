import type { Habit, Schedule } from './models'

export interface HabitTemplate {
  name: string
  mode: Habit['mode']
  schedule: Schedule
  goal?: number
  unit?: string
  routineRef?: string // reference to routine in same template
}

export interface TemplatePreset {
  id: string
  name: string
  description: string
  icon: string
  routines: Array<{ ref: string; name: string; icon: string }>
  habits: HabitTemplate[]
}

export const TEMPLATES: TemplatePreset[] = [
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Start your day right — water, exercise, breakfast',
    icon: 'sunrise',
    routines: [{ ref: 'morning', name: 'Pagi', icon: 'sunrise' }],
    habits: [
      {
        name: 'Minum air putih',
        mode: 'counter',
        schedule: { type: 'daily' },
        goal: 2,
        unit: 'gelas',
        routineRef: 'morning',
      },
      {
        name: 'Stretching/Yoga',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 10,
        unit: 'min',
        routineRef: 'morning',
      },
      {
        name: 'Sarapan sehat',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'morning',
      },
      {
        name: 'Sikat gigi pagi',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'morning',
      },
    ],
  },

  {
    id: 'workout-fitness',
    name: 'Workout & Fitness',
    description: '3-4x/week gym, cardio, steps tracking',
    icon: 'dumbbell',
    routines: [{ ref: 'fitness', name: 'Olahraga', icon: 'dumbbell' }],
    habits: [
      {
        name: 'Gym workout',
        mode: 'timer',
        schedule: { type: 'weekly', timesPerWeek: 3, weekdays: [1, 3, 5] },
        goal: 60,
        unit: 'min',
        routineRef: 'fitness',
      },
      {
        name: 'Cardio (lari/sepeda)',
        mode: 'timer',
        schedule: { type: 'weekly', timesPerWeek: 2 },
        goal: 30,
        unit: 'min',
        routineRef: 'fitness',
      },
      {
        name: 'Langkah harian',
        mode: 'number',
        schedule: { type: 'daily' },
        goal: 10000,
        unit: 'steps',
        routineRef: 'fitness',
      },
      {
        name: 'Minum protein',
        mode: 'checkbox',
        schedule: { type: 'weekly', timesPerWeek: 3 },
        routineRef: 'fitness',
      },
    ],
  },

  {
    id: 'learning-study',
    name: 'Learning & Study',
    description: 'Daily reading, focused study sessions, online courses',
    icon: 'book',
    routines: [{ ref: 'learning', name: 'Belajar', icon: 'book' }],
    habits: [
      {
        name: 'Baca buku',
        mode: 'number',
        schedule: { type: 'daily' },
        goal: 20,
        unit: 'halaman',
        routineRef: 'learning',
      },
      {
        name: 'Deep work/fokus',
        mode: 'timer',
        schedule: { type: 'daily', weekdays: [1, 2, 3, 4, 5] },
        goal: 90,
        unit: 'min',
        routineRef: 'learning',
      },
      {
        name: 'Online course',
        mode: 'timer',
        schedule: { type: 'weekly', timesPerWeek: 3 },
        goal: 30,
        unit: 'min',
        routineRef: 'learning',
      },
      {
        name: 'Review notes',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'learning',
      },
    ],
  },

  {
    id: 'health-wellness',
    name: 'Health & Wellness',
    description: 'Meditation, vitamins, sleep tracking, hydration',
    icon: 'heart',
    routines: [{ ref: 'health', name: 'Kesehatan', icon: 'heart' }],
    habits: [
      {
        name: 'Meditasi',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 10,
        unit: 'min',
        routineRef: 'health',
      },
      {
        name: 'Minum air 8 gelas',
        mode: 'counter',
        schedule: { type: 'daily' },
        goal: 8,
        unit: 'gelas',
        routineRef: 'health',
      },
      {
        name: 'Vitamin/suplemen',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'health',
      },
      {
        name: 'Tidur 8 jam',
        mode: 'number',
        schedule: { type: 'daily' },
        goal: 8,
        unit: 'jam',
        routineRef: 'health',
      },
      {
        name: 'No junk food',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'health',
      },
    ],
  },

  {
    id: 'evening-routine',
    name: 'Evening Routine',
    description: 'Wind down — dinner, skincare, journal, no screen time',
    icon: 'moon',
    routines: [{ ref: 'evening', name: 'Malam', icon: 'moon' }],
    habits: [
      {
        name: 'Makan malam sehat',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'evening',
      },
      {
        name: 'Skincare routine',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'evening',
      },
      {
        name: 'Journaling',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 10,
        unit: 'min',
        routineRef: 'evening',
      },
      {
        name: 'No screen 1 jam sebelum tidur',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'evening',
      },
      {
        name: 'Sikat gigi malam',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'evening',
      },
    ],
  },

  {
    id: 'productivity-work',
    name: 'Productivity & Work',
    description: 'Daily planning, deep work, review, inbox zero',
    icon: 'target',
    routines: [{ ref: 'work', name: 'Produktif', icon: 'target' }],
    habits: [
      {
        name: 'Daily planning',
        mode: 'checkbox',
        schedule: { type: 'daily', weekdays: [1, 2, 3, 4, 5] },
        routineRef: 'work',
      },
      {
        name: 'Pomodoro (4 session)',
        mode: 'counter',
        schedule: { type: 'daily', weekdays: [1, 2, 3, 4, 5] },
        goal: 4,
        unit: 'session',
        routineRef: 'work',
      },
      {
        name: 'Inbox zero',
        mode: 'checkbox',
        schedule: { type: 'daily', weekdays: [1, 2, 3, 4, 5] },
        routineRef: 'work',
      },
      {
        name: 'Weekly review',
        mode: 'checkbox',
        schedule: { type: 'weekly', timesPerWeek: 1, weekdays: [5] },
        routineRef: 'work',
      },
    ],
  },

  {
    id: 'minimal-starter',
    name: 'Minimal Starter',
    description: 'Simple 3-habit daily routine to get started',
    icon: 'sprout',
    routines: [],
    habits: [
      {
        name: 'Minum air putih',
        mode: 'counter',
        schedule: { type: 'daily' },
        goal: 8,
        unit: 'gelas',
      },
      {
        name: 'Olahraga',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 30,
        unit: 'min',
      },
      {
        name: 'Baca buku',
        mode: 'number',
        schedule: { type: 'daily' },
        goal: 10,
        unit: 'halaman',
      },
    ],
  },

  {
    id: 'ghost-mode',
    name: 'Ghost Mode 6 Months',
    description:
      'Disappear. Focus. Transform. — train like warrior, deep work, clean eating, zero vices',
    icon: 'moon-star',
    routines: [
      { ref: 'pagi', name: 'Pagi', icon: 'sunrise' },
      { ref: 'malam', name: 'Malam', icon: 'moon' },
    ],
    habits: [
      // PAGI — eksekusi harian
      {
        name: 'Bangun ≤ 05.30',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'pagi',
      },
      {
        name: 'Train like warrior',
        mode: 'checkbox',
        schedule: { type: 'weekly', timesPerWeek: 4 },
        routineRef: 'pagi',
      },
      {
        name: 'Jalan 8k langkah',
        mode: 'number',
        schedule: { type: 'daily' },
        goal: 8000,
        unit: 'langkah',
        routineRef: 'pagi',
      },
      {
        name: 'Deep work (NO HP)',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 90,
        unit: 'min',
        routineRef: 'pagi',
      },
      {
        name: 'Protein tiap makan',
        mode: 'counter',
        schedule: { type: 'daily' },
        goal: 3,
        unit: 'x',
        routineRef: 'pagi',
      },
      {
        name: 'Air 2L (8 gelas)',
        mode: 'counter',
        schedule: { type: 'daily' },
        goal: 8,
        unit: 'gelas',
        routineRef: 'pagi',
      },
      // MALAM — rutinitas harian template
      {
        name: 'Review: 1 win hari ini',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
      {
        name: 'Jurnal 5 baris',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 5,
        unit: 'min',
        routineRef: 'malam',
      },
      {
        name: 'Makan bersih 80%',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
      {
        name: 'Zero vice (scroll/game)',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
      {
        name: 'HP off 22.00',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
      {
        name: 'Tidur sebelum 23.00',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
      // MINGGUAN — weekly check tiap Ahad
      {
        name: 'Weekly review (Ahad)',
        mode: 'checkbox',
        schedule: { type: 'weekly', timesPerWeek: 1, weekdays: [0] },
      },
    ],
  },
]
