/**
 * ApprovalFlowModel.js - Model Layer (MVP)
 * Manages Approval Flow configuration, data structures, and pure resolution logic.
 */

// Request Types definition
export const REQUEST_TYPES = [
  {
    id: 'leave',
    label: 'Leave & Time Off',
    code: 'LEAVE',
    description: 'Annual leave, sick leave, or personal time off requests',
    icon: 'Calendar'
  },
  {
    id: 'manual_attendance',
    label: 'Manual Attendance',
    code: 'ATTENDANCE',
    description: 'Correction for missed clock-in/out or fingerprint/geo-tag issues',
    icon: 'Clock'
  },
  {
    id: 'overtime',
    label: 'Overtime',
    code: 'OVERTIME',
    description: 'Requests for extra working hours outside standard shift schedule',
    icon: 'Briefcase'
  },
  {
    id: 'change_shift',
    label: 'Shift Exchange',
    code: 'SHIFT_EXCHANGE',
    description: 'Requests for swapping work shifts between co-workers',
    icon: 'RefreshCw'
  }
];

// Available Roles in BMS
export const ROLES = [
  { id: 'role-spv', name: 'Supervisor', levelOrder: 1 },
  { id: 'role-mgr', name: 'Manager', levelOrder: 2 },
  { id: 'role-head', name: 'Head of Department', levelOrder: 3 },
  { id: 'role-hr', name: 'HR Specialist / Manager', levelOrder: 4 },
  { id: 'role-dir', name: 'Director', levelOrder: 5 }
];

// Mock Departments (9 Specified Departments)
export const DEPARTMENTS = [
  {
    id: 'dept-bm',
    name: 'Building Management',
    code: 'BM',
    headId: 'emp-013',
    description: 'Oversees property operations, facility standards, and building administration'
  },
  {
    id: 'dept-tr',
    name: 'Tenant Relation',
    code: 'TR',
    headId: 'emp-002',
    description: 'Manages tenant onboarding, complaints, relationship, and leasing support'
  },
  {
    id: 'dept-fin',
    name: 'Finance',
    code: 'FIN',
    headId: 'emp-006',
    description: 'Handles billing, tenant invoicing, utility payments, and accounting'
  },
  {
    id: 'dept-hrd',
    name: 'HRD',
    code: 'HRD',
    headId: 'emp-008',
    description: 'Human resources development, employee relations, and personnel management'
  },
  {
    id: 'dept-eng',
    name: 'Engineering',
    code: 'ENG',
    headId: 'emp-004',
    description: 'MEP maintenance, civil work, HVAC, elevator, and power infrastructure'
  },
  {
    id: 'dept-hk',
    name: 'Housekeeping',
    code: 'HK',
    headId: 'emp-009',
    description: 'Daily hygiene, waste management, pest control, and area cleanliness'
  },
  {
    id: 'dept-sec',
    name: 'Security',
    code: 'SEC',
    headId: 'emp-010',
    description: 'Access control, 24/7 building surveillance, safety, and parking operations'
  },
  {
    id: 'dept-bs',
    name: 'Building Service',
    code: 'BS',
    headId: 'emp-011',
    description: 'Specialized building amenity upkeep, landscaping, and logistical support'
  },
  {
    id: 'dept-mgmt',
    name: 'Management',
    code: 'MGMT',
    headId: 'emp-012',
    description: 'Executive decision making, strategy, policy governance, and oversight'
  }
];

// Mock Employees with Role and Department bindings
export const EMPLOYEES = [
  {
    id: 'emp-001',
    name: 'Budi Hartono',
    nik: '3174051204850001',
    email: 'budi.hartono@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-spv',
    position: 'Building Management',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-002',
    name: 'Jessica Tanuwijaya',
    nik: '3171015508920002',
    email: 'jessica.t@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-mgr',
    position: 'Tenant Relation',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-003',
    name: 'Ahmad Fauzi',
    nik: '3174021406890003',
    email: 'ahmad.fauzi@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-spv',
    position: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-004',
    name: 'Bambang Sudibyo',
    nik: '3275031902800004',
    email: 'bambang.s@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-mgr',
    position: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-005',
    name: 'Dewi Lestari',
    nik: '3173064811910005',
    email: 'dewi.lestari@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-spv',
    position: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-006',
    name: 'Robert Gunawan',
    nik: '3174052109840006',
    email: 'robert.g@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-mgr',
    position: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-007',
    name: 'Siti Rahmawati',
    nik: '3276016205880007',
    email: 'siti.rahma@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-spv',
    position: 'HRD',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-008',
    name: 'Hendrik Pratama',
    nik: '3171041007860008',
    email: 'hendrik.p@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-mgr',
    position: 'HRD',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-009',
    name: 'Agus Setiawan',
    nik: '3175022512900009',
    email: 'agus.s@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-010',
    name: 'Hendro Nugroho',
    nik: '3275040304870010',
    email: 'hendro.n@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-011',
    name: 'Dimas Prasetyo',
    nik: '3174031608930011',
    email: 'dimas.p@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-012',
    name: 'Maya Indah Permata',
    nik: '3171025803850012',
    email: 'maya.indah@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-dir',
    position: 'Management',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-013',
    name: 'Joko Widodo Santoso',
    nik: '3174010901780013',
    email: 'joko.ws@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-head',
    position: 'Building Management',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-014',
    name: 'Anisa Maharani',
    nik: '3276025109920014',
    email: 'anisa.m@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-hr',
    position: 'HRD',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-015',
    name: 'Rian Hidayat',
    nik: '3175041703900015',
    email: 'rian.h@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-mgr',
    position: 'Building Management',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-016',
    name: 'Fikri Ramadhan',
    nik: '3173022807910016',
    email: 'fikri.r@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-spv',
    position: 'Tenant Relation',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-017',
    name: 'Citra Dewi',
    nik: '3174056410890017',
    email: 'citra.d@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-head',
    position: 'Tenant Relation',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-018',
    name: 'Hendra Wijaya',
    nik: '3171011505820018',
    email: 'hendra.w@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-head',
    position: 'Finance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-019',
    name: 'Ir. Surya Pratama',
    nik: '3275010611750019',
    email: 'surya.p@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-head',
    position: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-020',
    name: 'Slamet Riyadi',
    nik: '3175032004830020',
    email: 'slamet.r@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-mgr',
    position: 'Housekeeping',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-021',
    name: 'Mayor (Purn) Danu Wibowo',
    nik: '3174041108700021',
    email: 'danu.w@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-mgr',
    position: 'Security',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-022',
    name: 'Gunawan Santoso',
    nik: '3276032402860022',
    email: 'gunawan.s@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-mgr',
    position: 'Building Service',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-023',
    name: 'Drs. Hartono Kusuma',
    nik: '3171030512680023',
    email: 'hartono.k@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-head',
    position: 'Management',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    status: 'active'
  },
  {
    id: 'emp-024',
    name: 'Kevin Sanjaya',
    nik: '3174051806940024',
    email: 'kevin.s@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-spv',
    position: 'Finance',
    status: 'active'
  },
  {
    id: 'emp-025',
    name: 'Nadia Putri',
    nik: '3174055209930025',
    email: 'nadia.p@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-spv',
    position: 'Finance',
    status: 'active'
  },
  {
    id: 'emp-026',
    name: 'Reza Rahardian',
    nik: '3174011203880026',
    email: 'reza.r@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-spv',
    position: 'Building Management',
    status: 'active'
  },
  {
    id: 'emp-027',
    name: 'Tari Andini',
    nik: '3174025407920027',
    email: 'tari.a@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-spv',
    position: 'Building Management',
    status: 'active'
  },
  {
    id: 'emp-028',
    name: 'Aditya Pratama',
    nik: '3171011904910028',
    email: 'aditya.p@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-spv',
    position: 'Tenant Relation',
    status: 'active'
  },
  {
    id: 'emp-029',
    name: 'Clara Shinta',
    nik: '3171026011930029',
    email: 'clara.s@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-spv',
    position: 'Tenant Relation',
    status: 'active'
  },
  {
    id: 'emp-030',
    name: 'Dedi Kurniawan',
    nik: '3275011405890030',
    email: 'dedi.k@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-spv',
    position: 'Engineering',
    status: 'active'
  },
  {
    id: 'emp-031',
    name: 'Eko Prasetyo',
    nik: '3275022208900031',
    email: 'eko.p@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-spv',
    position: 'Engineering',
    status: 'active'
  },
  {
    id: 'emp-032',
    name: 'Farhan Maulana',
    nik: '3276010507910032',
    email: 'farhan.m@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-spv',
    position: 'HRD',
    status: 'active'
  },
  {
    id: 'emp-033',
    name: 'Gita Permata',
    nik: '3276024803940033',
    email: 'gita.p@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-spv',
    position: 'HRD',
    status: 'active'
  },
  // Housekeeping additions
  {
    id: 'emp-034',
    name: 'Joko Susilo',
    nik: '3175021203870034',
    email: 'joko.s@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    status: 'active'
  },
  {
    id: 'emp-035',
    name: 'Siti Aminah',
    nik: '3175035508910035',
    email: 'siti.a@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    status: 'active'
  },
  {
    id: 'emp-036',
    name: 'Rudi Hermawan',
    nik: '3175042405890036',
    email: 'rudi.h@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    status: 'active'
  },
  {
    id: 'emp-056',
    name: 'Nurdin Abdullah',
    nik: '3175051904880056',
    email: 'nurdin.a@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    status: 'active'
  },
  // Security additions
  {
    id: 'emp-037',
    name: 'Agus Priyanto',
    nik: '3275041506840037',
    email: 'agus.p@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    status: 'active'
  },
  {
    id: 'emp-038',
    name: 'Bambang Irawan',
    nik: '3275051909860038',
    email: 'bambang.i@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    status: 'active'
  },
  {
    id: 'emp-039',
    name: 'Dedi Mulyadi',
    nik: '3275062811880039',
    email: 'dedi.m@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    status: 'active'
  },
  {
    id: 'emp-057',
    name: 'Subur Santoso',
    nik: '3275071101850057',
    email: 'subur.s@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    status: 'active'
  },
  // Building Service additions
  {
    id: 'emp-040',
    name: 'Ilham Saputra',
    nik: '3174031707920040',
    email: 'ilham.s@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    status: 'active'
  },
  {
    id: 'emp-041',
    name: 'Wahyu Hidayat',
    nik: '3174042004900041',
    email: 'wahyu.h@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    status: 'active'
  },
  {
    id: 'emp-042',
    name: 'Arif Budiman',
    nik: '3174051112930042',
    email: 'arif.b@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    status: 'active'
  },
  {
    id: 'emp-058',
    name: 'Panji Triatmodjo',
    nik: '3174062309910058',
    email: 'panji.t@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    status: 'active'
  },
  // Management additions
  {
    id: 'emp-043',
    name: 'Cynthia Stephanie',
    nik: '3171025901860043',
    email: 'cynthia.s@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-spv',
    position: 'Management',
    status: 'active'
  },
  {
    id: 'emp-044',
    name: 'David Chandra',
    nik: '3171031409810044',
    email: 'david.c@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-spv',
    position: 'Management',
    status: 'active'
  },
  {
    id: 'emp-045',
    name: 'Erlina Suryani',
    nik: '3171046503840045',
    email: 'erlina.s@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-spv',
    position: 'Management',
    status: 'active'
  },
  {
    id: 'emp-059',
    name: 'Franky Sihombing',
    nik: '3171050802790059',
    email: 'franky.s@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-spv',
    position: 'Management',
    status: 'active'
  },
  // Building Management additions
  {
    id: 'emp-046',
    name: 'Hendra Gunawan',
    nik: '3174021508890046',
    email: 'hendra.g@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-spv',
    position: 'Building Management',
    status: 'active'
  },
  {
    id: 'emp-047',
    name: 'Rini Wulandari',
    nik: '3174035604920047',
    email: 'rini.w@indoland.co.id',
    departmentId: 'dept-bm',
    roleId: 'role-spv',
    position: 'Building Management',
    status: 'active'
  },
  // Tenant Relation additions
  {
    id: 'emp-048',
    name: 'Rio Ferdinand',
    nik: '3171011809900048',
    email: 'rio.f@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-spv',
    position: 'Tenant Relation',
    status: 'active'
  },
  {
    id: 'emp-049',
    name: 'Vina Panduwinata',
    nik: '3171026112940049',
    email: 'vina.p@indoland.co.id',
    departmentId: 'dept-tr',
    roleId: 'role-spv',
    position: 'Tenant Relation',
    status: 'active'
  },
  // Finance additions
  {
    id: 'emp-050',
    name: 'Tommy Kurniawan',
    nik: '3173061503880050',
    email: 'tommy.k@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-spv',
    position: 'Finance',
    status: 'active'
  },
  {
    id: 'emp-051',
    name: 'Yulia Rachman',
    nik: '3174055907930051',
    email: 'yulia.r@indoland.co.id',
    departmentId: 'dept-fin',
    roleId: 'role-spv',
    position: 'Finance',
    status: 'active'
  },
  // HRD additions
  {
    id: 'emp-052',
    name: 'Doni Tata',
    nik: '3276012010890052',
    email: 'doni.t@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-spv',
    position: 'HRD',
    status: 'active'
  },
  {
    id: 'emp-053',
    name: 'Maya Septha',
    nik: '3276026501950053',
    email: 'maya.s@indoland.co.id',
    departmentId: 'dept-hrd',
    roleId: 'role-spv',
    position: 'HRD',
    status: 'active'
  },
  // Engineering additions
  {
    id: 'emp-054',
    name: 'Bagus Prakoso',
    nik: '3275011708870054',
    email: 'bagus.p@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-spv',
    position: 'Engineering',
    status: 'active'
  },
  {
    id: 'emp-055',
    name: 'Candra Wijaya',
    nik: '3275022506890055',
    email: 'candra.w@indoland.co.id',
    departmentId: 'dept-eng',
    roleId: 'role-spv',
    position: 'Engineering',
    status: 'active'
  },
  // Housekeeping additions
  {
    id: 'emp-060',
    name: 'Nugroho Adi',
    nik: '3175021208920060',
    email: 'nugroho.a@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    status: 'active'
  },
  {
    id: 'emp-061',
    name: 'Ratna Sari',
    nik: '3175034509930061',
    email: 'ratna.s@indoland.co.id',
    departmentId: 'dept-hk',
    roleId: 'role-spv',
    position: 'Housekeeping',
    status: 'active'
  },
  // Security additions
  {
    id: 'emp-062',
    name: 'Bambang Tri',
    nik: '3275041103880062',
    email: 'bambang.t@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    status: 'active'
  },
  {
    id: 'emp-063',
    name: 'Heri Kuswanto',
    nik: '3275042205890063',
    email: 'heri.k@indoland.co.id',
    departmentId: 'dept-sec',
    roleId: 'role-spv',
    position: 'Security',
    status: 'active'
  },
  // Building Service additions
  {
    id: 'emp-064',
    name: 'Ahmad Faisal',
    nik: '3174032104940064',
    email: 'ahmad.f@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    status: 'active'
  },
  {
    id: 'emp-065',
    name: 'Wahyu Hidayat',
    nik: '3174031507950065',
    email: 'wahyu.h@indoland.co.id',
    departmentId: 'dept-bs',
    roleId: 'role-spv',
    position: 'Building Service',
    status: 'active'
  },
  // Management additions
  {
    id: 'emp-066',
    name: 'Stephanie Gunawan',
    nik: '3171026402860066',
    email: 'stephanie.g@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-mgr',
    position: 'Management',
    status: 'active'
  },
  {
    id: 'emp-067',
    name: 'Kevin Jonathan',
    nik: '3171021908880067',
    email: 'kevin.j@indoland.co.id',
    departmentId: 'dept-mgmt',
    roleId: 'role-mgr',
    position: 'Management',
    status: 'active'
  }
];

// Helper to generate a default approval chain (1 level by default)
export const createDefaultChain = (levelRoles = ['role-spv']) => ({
  levels: levelRoles.map((roleId, index) => ({
    id: `lvl-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
    roleId: roleId,
    mode: 'all',
    userIds: [],
    rule: 'any'
  })),
  requireRejectNote: true,
  fallback: 'escalate'
});

// Initial mock configurations (All 1 level by default before custom configuration)
export const INITIAL_APPROVAL_CONFIGS = [
  // 1. Building Management default (Initial default state where role is not selected yet)
  {
    id: 'cfg-dept-bm-all',
    targetType: 'department',
    targetId: 'dept-bm',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-bm-1',
          roleId: '',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },

  // 2. Tenant Relation default
  {
    id: 'cfg-dept-tr-all',
    targetType: 'department',
    targetId: 'dept-tr',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-tr-1',
          roleId: 'dept-tr',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },

  // 3. Finance default
  {
    id: 'cfg-dept-fin-all',
    targetType: 'department',
    targetId: 'dept-fin',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-fin-1',
          roleId: 'dept-fin',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },

  // 4. HRD default
  {
    id: 'cfg-dept-hrd-all',
    targetType: 'department',
    targetId: 'dept-hrd',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-hrd-1',
          roleId: 'dept-hrd',
          mode: 'selected',
          userIds: ['emp-008'],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'notify_admin'
    }
  },

  // 5. Engineering default
  {
    id: 'cfg-dept-eng-all',
    targetType: 'department',
    targetId: 'dept-eng',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-eng-1',
          roleId: 'dept-eng',
          mode: 'selected',
          userIds: ['emp-003'],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },
  // 5b. Engineering Overtime override (kept with role-spv for specific unit test verification)
  {
    id: 'cfg-dept-eng-overtime',
    targetType: 'department',
    targetId: 'dept-eng',
    scope: 'overtime',
    chain: {
      levels: [
        {
          id: 'lvl-eng-ot-1',
          roleId: 'role-spv',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'role_all'
    }
  },

  // 6. Housekeeping default
  {
    id: 'cfg-dept-hk-all',
    targetType: 'department',
    targetId: 'dept-hk',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-hk-1',
          roleId: 'dept-hk',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },

  // 7. Security default
  {
    id: 'cfg-dept-sec-all',
    targetType: 'department',
    targetId: 'dept-sec',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-sec-1',
          roleId: 'dept-sec',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },

  // 8. Building Service default
  {
    id: 'cfg-dept-bs-all',
    targetType: 'department',
    targetId: 'dept-bs',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-bs-1',
          roleId: 'dept-bs',
          mode: 'all',
          userIds: [],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  },

  // 9. Management default
  {
    id: 'cfg-dept-mgmt-all',
    targetType: 'department',
    targetId: 'dept-mgmt',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-mgmt-1',
          roleId: 'dept-mgmt',
          mode: 'selected',
          userIds: ['emp-012'],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'notify_admin'
    }
  },

  // 10. Employee Custom Override (e.g. Jessica Tanuwijaya emp-002 in TR)
  {
    id: 'cfg-emp-002-all',
    targetType: 'employee',
    targetId: 'emp-002',
    scope: 'all_types',
    chain: {
      levels: [
        {
          id: 'lvl-emp2-1',
          roleId: 'dept-bs',
          mode: 'selected',
          userIds: ['emp-011'],
          rule: 'any'
        },
        {
          id: 'lvl-emp2-2',
          roleId: 'dept-mgmt',
          mode: 'selected',
          userIds: ['emp-012'],
          rule: 'any'
        }
      ],
      requireRejectNote: true,
      fallback: 'escalate'
    }
  }
];

// Global Fallback Chain when nothing is configured (1 level default)
export const GLOBAL_FALLBACK_CHAIN = {
  levels: [
    {
      id: 'lvl-global-1',
      roleId: 'role-spv',
      mode: 'all',
      userIds: [],
      rule: 'any'
    }
  ],
  requireRejectNote: true,
  fallback: 'escalate'
};

/**
 * Pure Resolution Engine
 * Determines the exact approval chain that applies to a given employee and request type.
 *
 * Resolution Order:
 * 1. Employee + specific type
 * 2. Employee + all types (scope === 'all_types')
 * 3. Department + specific type
 * 4. Department + all types (scope === 'all_types')
 * 5. Global Fallback
 *
 * Edge Cases Handled:
 * - Self-approval skip: If requester is in the approver pool, they are omitted from that level.
 *   If that leaves the level with 0 approvers, the level is bypassed.
 * - Consecutive duplicate skip: If level N has the same resolved approver(s) as level N-1, auto-skip level N.
 * - Empty pool fallback: If an eligible approver pool is empty (e.g. deactivated users), apply level/chain fallback.
 *
 * @param {Object} employee - The requester employee object { id, name, departmentId, roleId, ... }
 * @param {string} requestType - The request type id ('leave' | 'manual_attendance' | 'overtime' | 'change_shift')
 * @param {Array} configs - Array of ApprovalConfig objects
 * @param {Array} employeesList - Array of all employees (defaults to EMPLOYEES)
 * @param {Array} rolesList - Array of all roles (defaults to ROLES)
 * @param {Object} defaultFallback - Fallback chain (defaults to GLOBAL_FALLBACK_CHAIN)
 * @returns {Object} { matchedConfig, resolutionSource, resolvedLevels, chainMeta }
 */
export function resolveApprovalChain(
  employee,
  requestType,
  configs = INITIAL_APPROVAL_CONFIGS,
  employeesList = EMPLOYEES,
  rolesList = ROLES,
  defaultFallback = GLOBAL_FALLBACK_CHAIN
) {
  if (!employee) {
    return {
      matchedConfig: null,
      resolutionSource: 'global_fallback',
      resolvedLevels: [],
      chainMeta: defaultFallback
    };
  }

  // 1. Employee + specific type
  const empSpecific = configs.find(
    (c) => c.targetType === 'employee' && c.targetId === employee.id && c.scope === requestType
  );
  if (empSpecific) {
    return formatResolvedResult(empSpecific.chain, 'employee_specific', empSpecific, employee, employeesList, rolesList);
  }

  // 2. Employee + all types
  const empAll = configs.find(
    (c) => c.targetType === 'employee' && c.targetId === employee.id && c.scope === 'all_types'
  );
  if (empAll) {
    return formatResolvedResult(empAll.chain, 'employee_all_types', empAll, employee, employeesList, rolesList);
  }

  // 3. Department + specific type
  if (employee.departmentId) {
    const deptSpecific = configs.find(
      (c) => c.targetType === 'department' && c.targetId === employee.departmentId && c.scope === requestType
    );
    if (deptSpecific) {
      return formatResolvedResult(deptSpecific.chain, 'department_specific', deptSpecific, employee, employeesList, rolesList);
    }

    // 4. Department + all types
    const deptAll = configs.find(
      (c) => c.targetType === 'department' && c.targetId === employee.departmentId && c.scope === 'all_types'
    );
    if (deptAll) {
      return formatResolvedResult(deptAll.chain, 'department_all_types', deptAll, employee, employeesList, rolesList);
    }
  }

  // 5. Global fallback
  return formatResolvedResult(defaultFallback, 'global_fallback', null, employee, employeesList, rolesList);
}

/**
 * Formats and applies edge-case processing (self-approval skip, duplicate skip, pool resolution)
 */
function formatResolvedResult(rawChain, source, matchedConfig, requester, employeesList, rolesList) {
  const resolvedLevels = [];
  let previousApproverSignature = null;

  for (let i = 0; i < (rawChain.levels || []).length; i++) {
    const level = rawChain.levels[i];
    const role = rolesList.find((r) => r.id === level.roleId) ||
                 DEPARTMENTS.find((d) => d.id === level.roleId) ||
                 { id: level.roleId, name: 'Unknown Approver' };

    // Get eligible approvers for this role or department
    let eligibleUsers = [];
    if (level.mode === 'all') {
      eligibleUsers = employeesList.filter(
        (emp) => (emp.roleId === level.roleId || emp.departmentId === level.roleId) && emp.status === 'active'
      );
    } else {
      eligibleUsers = employeesList.filter(
        (emp) => level.userIds.includes(emp.id) && emp.status === 'active'
      );
    }

    // Edge Case 1: Self-Approval Skip
    // Requester cannot approve their own request
    const filteredApprovers = eligibleUsers.filter((emp) => emp.id !== requester.id);
    const selfApprovalSkipped = eligibleUsers.length > 0 && filteredApprovers.length < eligibleUsers.length;

    // Edge Case 2: Empty pool check & fallback
    let isPoolEmpty = filteredApprovers.length === 0;
    let fallbackApplied = null;

    if (isPoolEmpty) {
      if (rawChain.fallback === 'role_all') {
        // Fallback: broaden to all active users of this role
        const broadened = employeesList.filter(
          (emp) => emp.roleId === level.roleId && emp.status === 'active' && emp.id !== requester.id
        );
        if (broadened.length > 0) {
          filteredApprovers.push(...broadened);
          isPoolEmpty = false;
          fallbackApplied = 'Broadened to all role members';
        }
      } else if (rawChain.fallback === 'escalate') {
        // Fallback: skip this level and escalate to next
        fallbackApplied = 'Escalated (level skipped due to empty pool)';
        continue;
      } else if (rawChain.fallback === 'notify_admin') {
        fallbackApplied = 'Routed to System Administrator';
      }
    }

    // Edge Case 3: Consecutive duplicate approver check
    // If exact same single approver was resolved in the previous level, skip this level
    const approverSignature = filteredApprovers.map((u) => u.id).sort().join(',');
    if (
      approverSignature &&
      previousApproverSignature &&
      approverSignature === previousApproverSignature &&
      filteredApprovers.length === 1
    ) {
      // Auto-skip duplicate consecutive level
      continue;
    }

    previousApproverSignature = approverSignature;

    resolvedLevels.push({
      levelNumber: resolvedLevels.length + 1,
      originalLevelId: level.id,
      roleId: level.roleId,
      roleName: role.name,
      mode: level.mode,
      rule: filteredApprovers.length > 1 ? level.rule : 'any',
      approvers: filteredApprovers,
      selfApprovalSkipped,
      isPoolEmpty,
      fallbackApplied
    });
  }

  return {
    matchedConfig,
    resolutionSource: source,
    resolvedLevels,
    chainMeta: {
      requireRejectNote: rawChain.requireRejectNote ?? true,
      fallback: rawChain.fallback ?? 'escalate',
      totalLevels: resolvedLevels.length
    }
  };
}
