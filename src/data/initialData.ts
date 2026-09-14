import { ExamConfig, ExamRoom, ExamScheduleItem, Proctor, Student } from '../types';
import { PRESET_LOGO_TUTWURI } from '../utils/logoUtils';
import { SMK_YAK_1_STS_SCHEDULE } from './schedulePresets';

export const initialConfig: ExamConfig = {
  schoolName: 'SMK YAK 1 BOGOR',
  npsn: '20220267',
  address: 'Jl. Kalimurni RT. 02/01, Kel. Kencana, Kec. Tanah Sareal',
  subdistrict: 'Kec. Tanah Sareal',
  district: 'Kota Bogor',
  province: 'Jawa Barat',
  postalCode: '16167',
  phone: '(0251) 7531234',
  email: 'smkyak1bogor@gmail.com',
  website: 'www.smkyak1bogor.sch.id',
  academicYear: '2026/2027',
  semester: 'Ganjil',
  examType: 'STS',
  examTitle: 'SUMATIF TENGAH SEMESTER (STS) GANJIL',
  principalName: 'Drs. H. Mulyadi, M.Pd.',
  principalNip: '19710815 199802 1 002',
  committeeHeadName: 'Ahmad Suhendar, S.Kom.',
  committeeHeadNip: '19840510 201001 1 018',
  issueDate: '28 September 2026',
  issuePlace: 'Kota Bogor',
  stampEnabled: true,
  stampSize: 100,
  stampOffsetX: 0,
  stampOffsetY: 0,
  stampRotation: -7,
  stampOpacity: 90,
  stampAboveSignature: true,
  signatureSize: 100,
  signatureOffsetX: 0,
  signatureOffsetY: 0,
  schoolLevel: 'SMK',
  codePrefix: '26-05',
  logoUrl: PRESET_LOGO_TUTWURI,
  major1Name: 'Administrasi Perkantoran (AP)',
  major2Name: 'Bisnis Digital & Pemasaran (BD)',
};

export const initialRooms: ExamRoom[] = [
  // Program Studi 1: Administrasi Perkantoran (AP) -> Ruang 01 s/d Ruang 05
  {
    id: 'room-1',
    roomCode: 'R.01',
    name: 'Ruang 01',
    location: 'Gedung A (Lantai 1) - Lab AP 1',
    capacity: 20,
    major: 'Administrasi Perkantoran (AP)',
    proctor1: 'Dra. Hj. Siti Maryam, M.Pd.',
    proctor2: '',
  },
  {
    id: 'room-2',
    roomCode: 'R.02',
    name: 'Ruang 02',
    location: 'Gedung A (Lantai 1) - Lab AP 2',
    capacity: 20,
    major: 'Administrasi Perkantoran (AP)',
    proctor1: 'Budi Santoso, S.Pd.',
    proctor2: '',
  },
  {
    id: 'room-3',
    roomCode: 'R.03',
    name: 'Ruang 03',
    location: 'Gedung A (Lantai 2) - R. Teori AP 1',
    capacity: 20,
    major: 'Administrasi Perkantoran (AP)',
    proctor1: 'Rina Astuti, S.E.',
    proctor2: '',
  },
  {
    id: 'room-4',
    roomCode: 'R.04',
    name: 'Ruang 04',
    location: 'Gedung A (Lantai 2) - R. Teori AP 2',
    capacity: 20,
    major: 'Administrasi Perkantoran (AP)',
    proctor1: 'Endang Wahyuni, M.Pd.',
    proctor2: '',
  },
  {
    id: 'room-5',
    roomCode: 'R.05',
    name: 'Ruang 05',
    location: 'Gedung A (Lantai 2) - R. Teori AP 3',
    capacity: 20,
    major: 'Administrasi Perkantoran (AP)',
    proctor1: 'Fauzi Rahman, S.Kom.',
    proctor2: '',
  },
  // Program Studi 2: Bisnis Digital & Pemasaran (BD) -> Ruang 06 s/d Ruang 10
  {
    id: 'room-6',
    roomCode: 'R.06',
    name: 'Ruang 06',
    location: 'Gedung B (Lantai 1) - Lab Bisnis Digital',
    capacity: 20,
    major: 'Bisnis Digital & Pemasaran (BD)',
    proctor1: 'Dewi Lestari, S.E., M.M.',
    proctor2: '',
  },
  {
    id: 'room-7',
    roomCode: 'R.07',
    name: 'Ruang 07',
    location: 'Gedung B (Lantai 1) - Lab Pemasaran',
    capacity: 20,
    major: 'Bisnis Digital & Pemasaran (BD)',
    proctor1: 'Hendro Gunawan, S.Kom.',
    proctor2: '',
  },
  {
    id: 'room-8',
    roomCode: 'R.08',
    name: 'Ruang 08',
    location: 'Gedung B (Lantai 2) - R. Teori BD 1',
    capacity: 20,
    major: 'Bisnis Digital & Pemasaran (BD)',
    proctor1: 'Sri Rahayu, S.Pd.',
    proctor2: '',
  },
  {
    id: 'room-9',
    roomCode: 'R.09',
    name: 'Ruang 09',
    location: 'Gedung B (Lantai 2) - R. Teori BD 2',
    capacity: 20,
    major: 'Bisnis Digital & Pemasaran (BD)',
    proctor1: 'Agus Setiawan, S.E.',
    proctor2: '',
  },
  {
    id: 'room-10',
    roomCode: 'R.10',
    name: 'Ruang 10',
    location: 'Gedung B (Lantai 2) - R. Teori BD 3',
    capacity: 20,
    major: 'Bisnis Digital & Pemasaran (BD)',
    proctor1: 'Nur Aini Farida, S.Pd.',
    proctor2: '',
  },
];

// 100 Indonesian student names for Program Studi Administrasi Perkantoran (AP)
const apNames = [
  'ADISTY PUTRI MAHARANI', 'AHMAD FAUZI NUGRAHA', 'AISYAH NURUL HUDA', 'ALDI PRASETYO', 'ALIFIA ZAHRA',
  'ANANDA RIZKY PRATAMA', 'ANDINI SEKAR KINANTI', 'ANGGA DWI SAPUTRA', 'ANISA FITRIANI', 'ARI KURNIAWAN',
  'AULIA RAHMADANI', 'BAGAS ADITYA', 'BELLA CLARISSA', 'BINTANG RAMADHAN', 'CANTIKA DEWI',
  'CINTA AMALIA', 'DAFFA IBNU HAFIDZ', 'DAMAR JATI WIBOWO', 'DEA ANANDA', 'DENI KURNIA',
  'DEVINA RATNASARI', 'DIMAS WAHYU UTOMO', 'DINA MARLINA', 'DWI KURNIAWAN', 'EKA PUTRI LESTARI',
  'FADLAN RABBANI', 'FAHRI AL GHIFARI', 'FARHAN RAMADHAN', 'FATHIA AZZAHRA', 'FAUZAN AZHARI',
  'FEBRIANA SAFITRI', 'FIRMANSYAH', 'GALANG PRASETYA', 'GITA GUTAMA', 'HAFIZH AL-KAUTSAR',
  'HANNA NUR FADHILAH', 'HENDRA KUSUMA', 'ILHAM MAULANA', 'INDRA LESMANA', 'INTAN PERMATASARI',
  'IRVAN MAULANA', 'JESSIKA AURELIA', 'JULIA RAHAYU', 'KAUTSAR AL-FATIH', 'KAYLA AZKA SALSABILA',
  'KEVIN ADITYA', 'LARASATI KUSUMA', 'LUTFI ARDIANSYAH', 'MAULANA MALIK IBRAHIM', 'MAYA INDRIANI',
  'MELATI SUKMA', 'MIFTAHUL HUDA', 'MUHAMMAD ALIF FAUZAN', 'MUHAMMAD FADLI', 'MUHAMMAD HAFIDZ',
  'MUHAMMAD ILHAM', 'MUHAMMAD RIFQI', 'MUHAMMAD RIZKY', 'NABILA KHAIRUNNISA', 'NADIA SAFIRA',
  'NAILA SALSABILA', 'NASYWA AZKA', 'NAUFAL ARKAN', 'NOVIANDRI PUTRA', 'NUR AZIZAH',
  'NURUL AISYAH', 'OKA PRATAMA', 'OKTAVIA RAMADHANI', 'PANJI SAPUTRA', 'PUTRA ADITYA',
  'PUTRI AYU LESTARI', 'RACHEL ANINDITA', 'RAFFI AHMAD FAUZI', 'RAHMA NUR AZIZAH', 'RAISHA NABILA',
  'RAMA DHANIAL', 'RANGGA WIJAYA', 'RANI ANGGRAENI', 'RATNA DEWI', 'RAYHAN PRATAMA',
  'RENDI SAPUTRA', 'RESTI FAUZIAH', 'REYNALDI', 'REZA MAULANA', 'RIDO ILLAHI',
  'RIFKI ADRIAN', 'RINA ANGGRAENI', 'RIO FEBRIAN', 'RISMA YULIANTI', 'RIZKI RAMADHAN',
  'SALMA NURUL AULIA', 'SALSABILA AZZAHRA', 'SANTI OCTAVIA', 'SEKAR AYU KINANTI', 'SELVIA INDAH',
  'SEPTIAN DWI CAHYO', 'SHINTA NUR AINI', 'SITI AISYAH', 'SITI NURHALIZA', 'TEGAR WICAKSONO'
];

// 100 Indonesian student names for Program Studi Bisnis Digital & Pemasaran (BD)
const bdNames = [
  'ABDILLAH PRATAMA', 'ACHMAD RIFALDI', 'ADINDA LESTARI', 'ADITYA BAYU SETIAWAN', 'AGUNG SETIAWAN',
  'AHMAD RAIHAN ALFARIZI', 'AIDA FITRIANA', 'ALDIAN FADILAH', 'ALVIN CHRISTIAN', 'AMELIA CITRA',
  'ANDHIKA PRATAMA', 'ANGGITA SARI', 'ANNISA NURUL HIDAYAH', 'ARDIAN MAULANA', 'ARIEF BUDIMAN',
  'ARIL RAMADHAN', 'ARYA BIMA PRASETYA', 'AURA KASIH', 'AZKA DZAKIYYAH', 'BAGUS PANGESTU',
  'BAYU AJI PAMUNGKAS', 'BILQIS UMAIRAH', 'BRAMANTYO', 'CHELSEA OLIVIA', 'DANI ARDIANSYAH',
  'DARA PUSPITA', 'DAVID CHRISTIAN', 'DEFRI NURHIDAYAT', 'DEWI ANGGRAENI', 'DHIKA PRATAMA',
  'DIAN AYU PUSPITA', 'DIKRI MAULANA', 'DONI SAPUTRA', 'DZIKRI MUHAMMAD', 'ELISABETH CLARA',
  'ELSA MAYORA', 'FADILAH RAHMAN', 'FAJAR SIDIK', 'FARADILA AYU', 'FARID HIDAYATULLAH',
  'FASHA NABILAH', 'FATUR RAHMAN', 'FAUZIAH NUR', 'FERDIAN DWI PUTRA', 'FIKRI HAIKAL',
  'FIRDAUS AMIN', 'GALUH CANDRA KIRANA', 'GILANG RAMADHAN', 'HAIDAR ALI', 'HANIFAH AZZAHRA',
  'HARIS MAULANA', 'HASAN BASRI', 'HILMAN SYAHPUTRA', 'IKHSAN MAULANA', 'INDAH PERMATA',
  'IQBAL TAWAKAL', 'IRFAN HAKIM', 'ISMI NUR AZIZAH', 'KEMAL PAHLEVI', 'KHAIRUL AZAM',
  'LATIFAH HANUM', 'LUKMAN HAKIM', 'LUTFIANA DEWI', 'M. FATHAN MUBINA', 'MARCELLINO PUTRA',
  'MARSYA AULIA', 'MEGA MUSTIKA', 'MOCHAMMAD ZIDANE', 'MUHAMMAD AL-GHAZALI', 'MUHAMMAD BILAL',
  'MUHAMMAD DAFFA', 'MUHAMMAD IQBAL', 'MUHAMMAD NABIL', 'MUHAMMAD RAYYAN', 'MUTIARA KARTIKA',
  'NABILAH PUTRI', 'NADINE AURELIA', 'NAJWA SHIHAB', 'NANDA ADITYA', 'NAVAL MAULANA',
  'NURUL FADILAH', 'PANJI ANOM', 'PRADITYA WIRAWAN', 'PUTRI NABILA', 'RADEN MAS BAGUS',
  'RAFLI DWI ANUGRAH', 'RAISHA RAMADHANI', 'RAYHAN ALVARO', 'REHAN SAPUTRA', 'RENDY FEBRIAN',
  'RESTU BUMI', 'RIFKY ARDIANSYAH', 'RINI SURYANI', 'RIZALDY AKBAR', 'SABRINA AULIA',
  'SAHRUL GUNAWAN', 'SALWA NABILA', 'SHAFIRA AULIA', 'SYAHRUL RAMADHAN', 'YOGA PRATAMA'
];

const apClasses = ['X AP 1', 'X AP 2', 'XI AP 1', 'XI AP 2', 'XII AP 1', 'XII AP 2'];
const bdClasses = ['X BD 1', 'X BD 2', 'XI BD 1', 'XI BD 2', 'XII BD 1', 'XII BD 2'];

// Generate 100 students for Administrasi Perkantoran (AP)
// Assigned to Ruang 01 s/d Ruang 05 (5 rooms x 20 seats = 100 students)
const apStudents: Student[] = apNames.map((name, idx) => {
  const roomIdx = Math.floor(idx / 20); // 0 to 4 (Ruang 01 to 05)
  const seatNum = (idx % 20) + 1; // 1 to 20
  const room = initialRooms[roomIdx];
  const cls = apClasses[idx % apClasses.length];
  const gender: 'L' | 'P' = idx % 2 === 0 ? 'P' : 'L';
  const numStr = String(idx + 1).padStart(3, '0');

  return {
    id: `std-ap-${idx + 1}`,
    examNumber: `26-05-01-${numStr}`,
    nisn: `00${70000000 + idx}`,
    nis: `262701${numStr}`,
    name,
    className: cls,
    gender,
    major: 'Administrasi Perkantoran (AP)',
    session: 1,
    roomId: room.id,
    roomName: room.name,
    seatNumber: seatNum,
  };
});

// Generate 100 students for Bisnis Digital & Pemasaran (BD)
// Assigned to Ruang 06 s/d Ruang 10 (5 rooms x 20 seats = 100 students)
const bdStudents: Student[] = bdNames.map((name, idx) => {
  const roomIdx = 5 + Math.floor(idx / 20); // 5 to 9 (Ruang 06 to 10)
  const seatNum = (idx % 20) + 1; // 1 to 20
  const room = initialRooms[roomIdx];
  const cls = bdClasses[idx % bdClasses.length];
  const gender: 'L' | 'P' = idx % 2 === 0 ? 'L' : 'P';
  const numStr = String(idx + 1).padStart(3, '0');

  return {
    id: `std-bd-${idx + 1}`,
    examNumber: `26-05-02-${numStr}`,
    nisn: `00${80000000 + idx}`,
    nis: `262702${numStr}`,
    name,
    className: cls,
    gender,
    major: 'Bisnis Digital & Pemasaran (BD)',
    session: 1,
    roomId: room.id,
    roomName: room.name,
    seatNumber: seatNum,
  };
});

export const initialStudents: Student[] = [...apStudents, ...bdStudents];

export const initialSchedule: ExamScheduleItem[] = SMK_YAK_1_STS_SCHEDULE;

export const initialProctors: Proctor[] = [
  {
    id: 'prc-1',
    name: 'Dra. Hj. Siti Maryam, M.Pd.',
    nip: '19750812 200201 2 004',
    subject: 'Korespondensi & Kearsipan',
    role: 'Pengawas Ruang',
    phone: '081234567801',
    assignedRoomId: 'room-1',
    assignedRoomCode: 'R.01',
    assignedPosition: 1,
  },
  {
    id: 'prc-2',
    name: 'Budi Santoso, S.Pd.',
    nip: '19810415 200901 1 009',
    subject: 'Simulasi & Komunikasi Digital',
    role: 'Pengawas Ruang',
    phone: '081234567802',
    assignedRoomId: 'room-2',
    assignedRoomCode: 'R.02',
    assignedPosition: 1,
  },
  {
    id: 'prc-3',
    name: 'Rina Astuti, S.E.',
    nip: '19860920 201101 2 012',
    subject: 'Administrasi Kepegawaian',
    role: 'Pengawas Ruang',
    phone: '081234567803',
    assignedRoomId: 'room-3',
    assignedRoomCode: 'R.03',
    assignedPosition: 1,
  },
  {
    id: 'prc-4',
    name: 'Endang Wahyuni, M.Pd.',
    nip: '19790311 200501 2 008',
    subject: 'Bahasa Indonesia Terapan',
    role: 'Pengawas Ruang',
    phone: '081234567804',
    assignedRoomId: 'room-4',
    assignedRoomCode: 'R.04',
    assignedPosition: 1,
  },
  {
    id: 'prc-5',
    name: 'Fauzi Rahman, S.Kom.',
    nip: '19900218 201801 1 007',
    subject: 'Teknologi Perkantoran',
    role: 'Pengawas Ruang',
    phone: '081234567805',
    assignedRoomId: 'room-5',
    assignedRoomCode: 'R.05',
    assignedPosition: 1,
  },
  {
    id: 'prc-6',
    name: 'Dewi Lestari, S.E., M.M.',
    nip: '19830524 200801 2 015',
    subject: 'Pemasaran Digital & E-Commerce',
    role: 'Pengawas Ruang',
    phone: '081234567806',
    assignedRoomId: 'room-6',
    assignedRoomCode: 'R.06',
    assignedPosition: 1,
  },
  {
    id: 'prc-7',
    name: 'Hendro Gunawan, S.Kom.',
    nip: '19871105 201402 1 003',
    subject: 'Bisnis Online & Content Marketing',
    role: 'Pengawas Ruang',
    phone: '081234567807',
    assignedRoomId: 'room-7',
    assignedRoomCode: 'R.07',
    assignedPosition: 1,
  },
  {
    id: 'prc-8',
    name: 'Sri Rahayu, S.Pd.',
    nip: '19850716 201001 2 011',
    subject: 'Pengelolaan Bisnis Ritel',
    role: 'Pengawas Ruang',
    phone: '081234567808',
    assignedRoomId: 'room-8',
    assignedRoomCode: 'R.08',
    assignedPosition: 1,
  },
  {
    id: 'prc-9',
    name: 'Agus Setiawan, S.E.',
    nip: '19800819 200604 1 010',
    subject: 'Perencanaan Bisnis',
    role: 'Pengawas Ruang',
    phone: '081234567809',
    assignedRoomId: 'room-9',
    assignedRoomCode: 'R.09',
    assignedPosition: 1,
  },
  {
    id: 'prc-10',
    name: 'Nur Aini Farida, S.Pd.',
    nip: '19920412 201903 2 006',
    subject: 'Matematika Terapan Bisnis',
    role: 'Pengawas Ruang',
    phone: '081234567810',
    assignedRoomId: 'room-10',
    assignedRoomCode: 'R.10',
    assignedPosition: 1,
  },
  {
    id: 'prc-cad-1',
    name: 'Irvan Maulana, S.Pd.',
    nip: '19930814 202001 1 005',
    subject: 'Pendidikan Jasmani & Olahraga',
    role: 'Pengawas Cadangan',
    phone: '081234567811',
  },
  {
    id: 'prc-cad-2',
    name: 'Siti Sarah, S.Pd.I.',
    nip: '19910625 201802 2 003',
    subject: 'Pendidikan Agama Islam',
    role: 'Pengawas Cadangan',
    phone: '081234567812',
  },
];
