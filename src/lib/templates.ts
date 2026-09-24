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

  {
    id: 'ghost-mindset',
    name: 'Ghost Mindset',
    description: '5 prinsip mindset: ownership, beast within, pain, no excuses, all-in',
    icon: 'brain',
    routines: [{ ref: 'refleksi', name: 'Refleksi', icon: 'brain' }],
    habits: [
      {
        name: 'Ownership: 3 masalah + kontrol',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
        routineRef: 'refleksi',
      },
      {
        name: 'Beast: 1 hal takut gagal',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
        routineRef: 'refleksi',
      },
      {
        name: 'Pain: pilih 1 pain harian',
        mode: 'checkbox',
        schedule: { type: 'weekly', timesPerWeek: 1, weekdays: [0] },
        routineRef: 'refleksi',
      },
      {
        name: 'No excuses: coret 5 alasan',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
        routineRef: 'refleksi',
      },
      {
        name: 'All-in: 1 skill + 1 habit badan',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
        routineRef: 'refleksi',
      },
    ],
  },

  {
    id: 'ghost-daily',
    name: 'Ghost Daily Execution',
    description: 'Train like warrior, work like robot, eat like king, reject vices',
    icon: 'target',
    routines: [
      { ref: 'pagi', name: 'Pagi', icon: 'sunrise' },
      { ref: 'siang', name: 'Siang', icon: 'sun' },
      { ref: 'malam', name: 'Malam', icon: 'moon' },
    ],
    habits: [
      {
        name: 'Bangun ≤ 05.30',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'pagi',
      },
      {
        name: 'Train: latihan beban/jalan',
        mode: 'checkbox',
        schedule: { type: 'weekly', timesPerWeek: 4 },
        routineRef: 'pagi',
      },
      {
        name: 'Air 2L',
        mode: 'counter',
        schedule: { type: 'daily' },
        goal: 8,
        unit: 'gelas',
        routineRef: 'pagi',
      },
      {
        name: 'Deep work 90m (NO HP)',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 90,
        unit: 'min',
        routineRef: 'pagi',
      },
      {
        name: 'Protein tiap makan',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'siang',
      },
      {
        name: 'Makan bersih 80%',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'siang',
      },
      {
        name: 'Reject vice: scroll/game/porn',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
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
        name: 'HP off 22.00',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
      {
        name: 'Tidur ≤ 23.00',
        mode: 'checkbox',
        schedule: { type: 'daily' },
        routineRef: 'malam',
      },
    ],
  },

  {
    id: 'ghost-milestones',
    name: 'Ghost Milestones',
    description: 'Checkpoint 6 bulan: Clean Up → Build → Push → Dominate',
    icon: 'calendar-check',
    routines: [],
    habits: [
      {
        name: 'Bulan 1: Clean Up — audit + hapus distraksi',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
      },
      {
        name: 'Bulan 1: Tetapkan 1 skill + 1 badan + 1 finansial',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
      },
      {
        name: 'Bulan 2-3: Deep work 2-3 jam/hari',
        mode: 'timer',
        schedule: { type: 'daily' },
        goal: 120,
        unit: 'min',
      },
      {
        name: 'Bulan 2-3: Mulai CREATE (2 output/minggu)',
        mode: 'counter',
        schedule: { type: 'weekly', timesPerWeek: 1, weekdays: [0] },
        goal: 2,
        unit: 'output',
      },
      {
        name: 'Bulan 4-5: Ambil proyek menantang',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
      },
      {
        name: 'Bulan 6: Launch / showcase',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
      },
      {
        name: 'Tentukan next 6 bulan',
        mode: 'checkbox',
        schedule: { type: 'monthly', dayOfMonth: 1 },
      },
    ],
  },
]
