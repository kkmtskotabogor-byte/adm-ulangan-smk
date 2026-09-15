import { ExamScheduleItem } from '../types';

/**
 * Jadwal STS Ganjil SMK YAK 1
 * Tahun Pelajaran 2026/2027
 * Sesuai dokumen resmi lampiran jadwal sekolah
 */
export const SMK_YAK_1_STS_SCHEDULE: ExamScheduleItem[] = [
  // 1. Senin/28 September 2026
  {
    id: 'smk-yak-1',
    dayName: 'Senin',
    date: '28 September 2026',
    sessionTime: '13.00-14.00',
    subject: 'Pendidikan Agama Islam dan Budi Pekerti',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-2',
    dayName: 'Senin',
    date: '28 September 2026',
    sessionTime: '14.00-14.30',
    subject: 'Istirahat',
    targetLevel: 'Semua Kelas',
    isBreak: true,
  },
  {
    id: 'smk-yak-3',
    dayName: 'Senin',
    date: '28 September 2026',
    sessionTime: '14.30-15.30',
    subject: 'Bahasa Indonesia',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },

  // 2. Selasa/29 September 2026
  {
    id: 'smk-yak-4',
    dayName: 'Selasa',
    date: '29 September 2026',
    sessionTime: '13.00-14.00',
    subject: 'PPKN',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-5',
    dayName: 'Selasa',
    date: '29 September 2026',
    sessionTime: '14.00-14.30',
    subject: 'Istirahat',
    targetLevel: 'Semua Kelas',
    isBreak: true,
  },
  {
    id: 'smk-yak-6',
    dayName: 'Selasa',
    date: '29 September 2026',
    sessionTime: '14.30-15.30',
    subject: 'Bahasa Inggris',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },

  // 3. Rabu/30 September 2026
  {
    id: 'smk-yak-7',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '13.00-14.00',
    subject: 'Bahasa Sunda',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-8',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '14.00-14.30',
    subject: 'Istirahat',
    targetLevel: 'Semua Kelas',
    isBreak: true,
  },
  {
    id: 'smk-yak-9',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '14.30-15.30',
    subject: 'Seni Budaya/Manajemen Logistik/Bisnis Digital',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-10',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '15.30-16.30',
    subject: 'Informatika',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },

  // 4. Kamis/01 Oktober 2026
  {
    id: 'smk-yak-11',
    dayName: 'Kamis',
    date: '01 Oktober 2026',
    sessionTime: '13.00-14.00',
    subject: 'PKWU/Sejarah Indonesia',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-12',
    dayName: 'Kamis',
    date: '01 Oktober 2026',
    sessionTime: '14.00-14.30',
    subject: 'Istirahat',
    targetLevel: 'Semua Kelas',
    isBreak: true,
  },
  {
    id: 'smk-yak-13',
    dayName: 'Kamis',
    date: '01 Oktober 2026',
    sessionTime: '14.30-15.30',
    subject: 'Aqidah Akhlak',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-14',
    dayName: 'Kamis',
    date: '01 Oktober 2026',
    sessionTime: '15.30-16.30',
    subject: 'Koding dan Kecerdasan Artifisial',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },

  // 5. Jumat/02 Oktober 2026
  {
    id: 'smk-yak-15',
    dayName: 'Jumat',
    date: '02 Oktober 2026',
    sessionTime: '13.00-14.00',
    subject: 'Matematika',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-16',
    dayName: 'Jumat',
    date: '02 Oktober 2026',
    sessionTime: '14.00-14.30',
    subject: 'Istirahat',
    targetLevel: 'Semua Kelas',
    isBreak: true,
  },
  {
    id: 'smk-yak-17',
    dayName: 'Jumat',
    date: '02 Oktober 2026',
    sessionTime: '14.30-15.30',
    subject: 'Penjasorkes',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },

  // 6. Sabtu/03 Oktober 2026
  {
    id: 'smk-yak-18',
    dayName: 'Sabtu',
    date: '03 Oktober 2026',
    sessionTime: '13.00-14.00',
    subject: 'Produktif',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
  {
    id: 'smk-yak-19',
    dayName: 'Sabtu',
    date: '03 Oktober 2026',
    sessionTime: '14.00-14.30',
    subject: 'Istirahat',
    targetLevel: 'Semua Kelas',
    isBreak: true,
  },
  {
    id: 'smk-yak-20',
    dayName: 'Sabtu',
    date: '03 Oktober 2026',
    sessionTime: '14.30-15.30',
    subject: 'Ilmu Pengetahuan Alam',
    targetLevel: 'Semua Kelas',
    isBreak: false,
  },
];

/**
 * Jadwal STS GANJIL MTS MANBAUL ISLAM
 * Tahun Pelajaran 2026/2027
 * Sesuai dokumen resmi lampiran jadwal sekolah
 */
export const MTS_MANBAUL_ISLAM_STS_SCHEDULE: ExamScheduleItem[] = [
  // 1. Senin/28 September 2026
  {
    id: 'sts-mi-1',
    dayName: 'Senin',
    date: '28 September 2026',
    sessionTime: '07.30-08.30',
    subject: 'Bahasa Indonesia',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-2',
    dayName: 'Senin',
    date: '28 September 2026',
    sessionTime: '08.30-09.30',
    subject: 'IPS',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-3',
    dayName: 'Senin',
    date: '28 September 2026',
    sessionTime: '10.00-11.00',
    subject: 'TIK',
    targetLevel: 'Semua Kelas',
  },
  // 2. Selasa/29 September 2026
  {
    id: 'sts-mi-4',
    dayName: 'Selasa',
    date: '29 September 2026',
    sessionTime: '07.30-08.30',
    subject: 'Matematika',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-5',
    dayName: 'Selasa',
    date: '29 September 2026',
    sessionTime: '08.30-09.30',
    subject: 'Alquran Hadist',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-6',
    dayName: 'Selasa',
    date: '29 September 2026',
    sessionTime: '10.00-11.00',
    subject: 'Prakarya',
    targetLevel: 'Semua Kelas',
  },
  // 3. Rabu/30 September 2026
  {
    id: 'sts-mi-7',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '07.30-08.30',
    subject: 'Bahasa Inggris',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-8',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '08.30-09.30',
    subject: 'Fiqih',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-9',
    dayName: 'Rabu',
    date: '30 September 2026',
    sessionTime: '10.00-11.00',
    subject: 'Seni Budaya',
    targetLevel: 'Semua Kelas',
  },
  // 4. Kamis/31 September 2026
  {
    id: 'sts-mi-10',
    dayName: 'Kamis',
    date: '31 September 2026',
    sessionTime: '07.30-08.30',
    subject: 'IPA',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-11',
    dayName: 'Kamis',
    date: '31 September 2026',
    sessionTime: '08.30-09.30',
    subject: 'Bahasa Sunda',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-12',
    dayName: 'Kamis',
    date: '31 September 2026',
    sessionTime: '10.00-11.00',
    subject: 'SKI',
    targetLevel: 'Semua Kelas',
  },
  // 5. Jumat/01 Oktober 2026
  {
    id: 'sts-mi-13',
    dayName: 'Jumat',
    date: '01 Oktober 2026',
    sessionTime: '07.30-08.30',
    subject: 'Pendidikan Pancasila',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-14',
    dayName: 'Jumat',
    date: '01 Oktober 2026',
    sessionTime: '09.00-10.00',
    subject: 'Bahasa Arab',
    targetLevel: 'Semua Kelas',
  },
  // 6. Sabtu/02 Oktober 2026
  {
    id: 'sts-mi-15',
    dayName: 'Sabtu',
    date: '02 Oktober 2026',
    sessionTime: '07.30-08.30',
    subject: 'Akidah Akhlak',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-16',
    dayName: 'Sabtu',
    date: '02 Oktober 2026',
    sessionTime: '08.30-09.30',
    subject: 'BTQ',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'sts-mi-17',
    dayName: 'Sabtu',
    date: '02 Oktober 2026',
    sessionTime: '10.00-11.00',
    subject: 'Penjasorkes',
    targetLevel: 'Semua Kelas',
  },
];

export const IMAGE_SAMPLE_SCHEDULE: ExamScheduleItem[] = SMK_YAK_1_STS_SCHEDULE;


export const MTS_MADRASAH_SCHEDULE: ExamScheduleItem[] = [
  {
    id: 'mts-1',
    dayName: 'Senin',
    date: '08 Juni 2026',
    sessionTime: '07.30 - 09.00',
    subject: "Al-Qur'an Hadits",
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-2',
    dayName: 'Senin',
    date: '08 Juni 2026',
    sessionTime: '09.30 - 11.00',
    subject: 'Akidah Akhlak',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-3',
    dayName: 'Selasa',
    date: '09 Juni 2026',
    sessionTime: '07.30 - 09.00',
    subject: 'Fikih',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-4',
    dayName: 'Selasa',
    date: '09 Juni 2026',
    sessionTime: '09.30 - 11.00',
    subject: 'Sejarah Kebudayaan Islam (SKI)',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-5',
    dayName: 'Rabu',
    date: '10 Juni 2026',
    sessionTime: '07.30 - 09.00',
    subject: 'Bahasa Arab',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-6',
    dayName: 'Rabu',
    date: '10 Juni 2026',
    sessionTime: '09.30 - 11.00',
    subject: 'Bahasa Indonesia',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-7',
    dayName: 'Kamis',
    date: '11 Juni 2026',
    sessionTime: '07.30 - 09.00',
    subject: 'Bahasa Inggris',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-8',
    dayName: 'Kamis',
    date: '11 Juni 2026',
    sessionTime: '09.30 - 11.00',
    subject: 'Matematika',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-9',
    dayName: 'Jum\'at',
    date: '12 Juni 2026',
    sessionTime: '07.30 - 09.00',
    subject: 'PPKn (Pendidikan Pancasila)',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-10',
    dayName: 'Sabtu',
    date: '13 Juni 2026',
    sessionTime: '07.30 - 09.00',
    subject: 'Ilmu Pengetahuan Alam (IPA)',
    targetLevel: 'Semua Kelas',
  },
  {
    id: 'mts-11',
    dayName: 'Sabtu',
    date: '13 Juni 2026',
    sessionTime: '09.30 - 11.00',
    subject: 'Ilmu Pengetahuan Sosial (IPS)',
    targetLevel: 'Semua Kelas',
  },
];
