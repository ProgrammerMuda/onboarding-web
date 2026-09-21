/**
 * TenantModel - Model Layer (MVP)
 * Manages tenant entities, summary KPI statistics, filter criteria, and mock records.
 */

export const TENANT_STATS = {
  totalActiveTenants: 1169,
  owners: 1084,
  activeRenters: 85,
  activeProxies: 14
};

export const TOWER_OPTIONS = [
  { value: '', label: 'All Towers' },
  { value: 'Tower A', label: 'Tower A (Alba)' },
  { value: 'Tower B', label: 'Tower B (Bonavista)' },
  { value: 'Tower C', label: 'Tower C (Corona)' },
  { value: 'Tower D', label: 'Tower D (Diamond)' }
];

export const ROLE_OPTIONS = [
  { value: '', label: 'All Roles / Types' },
  { value: 'OWNER', label: 'Owners' },
  { value: 'RENTER', label: 'Renters' },
  { value: 'PROXY', label: 'Proxies' }
];

// 100 Rich Realistic Mock Tenants
const BASE_NAMES = [
  { name: 'Aldi Mahardiansyah', email: 'aldi.mahardiansyah@gmail.com', phone: '089906151251', role: 'RENTER', unit: 'AC0906', type: 'renter', nik: '3174051204850001', npwp: '09.254.678.9-012.000' },
  { name: 'Amizah Nadine', email: 'amizah.nadine@yahoo.com', phone: '081287654321', role: 'RENTER', unit: 'AA2606', type: 'renter', nik: '3175026607920003', npwp: '12.456.789.0-015.000' },
  { name: 'Anisqe Adita', email: 'anisqe.adita@corp.id', phone: '081312345678', role: 'OWNER', unit: 'A9992', type: 'owner', nik: '3171014503880004', npwp: '34.567.890.1-018.000' },
  { name: 'Asep Saepudin', email: 'asep.saepudin@gmail.com', phone: '085798765432', role: 'OWNER', unit: 'D0404', type: 'owner', nik: '3273041208800002', npwp: '56.789.012.3-021.000' },
  { name: 'Astrid Kusnadi', email: 'astrid.kusnadi@gmail.com', phone: '081809876543', role: 'OWNER', unit: 'AA0708', type: 'owner', nik: '3174085409900007', npwp: '78.901.234.5-024.000' },
  { name: 'Christina Sudjie', email: 'christina.sudjie@gmail.com', phone: '081199887766', role: 'OWNER', unit: 'AF0208', proxyUnit: 'AF0207', type: 'owner', nik: '3173016106850008', npwp: '90.123.456.7-027.000' },
  { name: 'Dumaria BR. Manurung', email: 'dumaria.manurung@gmail.com', phone: '082134567890', role: 'RENTER', unit: 'AG0205', type: 'renter', nik: '1271035005870009', npwp: '01.234.567.8-030.000' },
  { name: 'Endang Piningsih', email: 'endang.piningsih@gmail.com', phone: '087812345678', role: 'OWNER', unit: 'AC1201', type: 'owner', nik: '3374024802820005', npwp: '23.456.789.0-033.000' },
  { name: 'Hasbu Pratama', email: 'hasbu.pratama@gmail.com', phone: '089612345678', role: 'RENTER', unit: 'AB1503', type: 'renter', nik: '3174092211930006', npwp: '45.678.901.2-036.000' },
  { name: 'Bambang Soeprapto', email: 'bambang.s@permatagroup.com', phone: '081290001122', role: 'OWNER', unit: 'AD0802', proxyUnit: 'AD0803', type: 'owner', nik: '3172021509750001', npwp: '67.890.123.4-039.000' },
  { name: 'Jessica Tanuwijaya', email: 'jessica.tan@fintech.co.id', phone: '081288990011', role: 'RENTER', unit: 'AD0804', type: 'renter', nik: '3174095804940001', npwp: '09.876.543.2-012.000' },
  { name: 'Jajang Saepudin', email: 'jajang.saepudin@gmail.com', phone: '085712345678', role: 'PROXY', unit: 'D0404', type: 'proxy', nik: '3273041505020001', npwp: '56.789.012.3-022.000' },
  { name: 'Dewi Lestari', email: 'dewi.lestari@gmail.com', phone: '081377889900', role: 'RENTER', unit: 'AE1005', type: 'renter', nik: '3271015604890003', npwp: '89.012.345.6-042.000' },
  { name: 'Ferry Salim', email: 'ferry.salim@investor.co.id', phone: '081688776655', role: 'OWNER', unit: 'AF1102', type: 'owner', nik: '3174031908780004', npwp: '12.345.678.9-045.000' },
  { name: 'Grace Natalie', email: 'grace.natalie@outlook.com', phone: '081822334455', role: 'OWNER', unit: 'AG0508', type: 'owner', nik: '3171056407910002', npwp: '34.567.890.1-048.000' },
  { name: 'Hendro Gunawan', email: 'hendro.gunawan@megacorp.id', phone: '081255667788', role: 'RENTER', unit: 'AH0304', type: 'renter', nik: '3174061401830009', npwp: '56.789.012.3-051.000' },
  { name: 'Indah Permatasari', email: 'indah.permatasari@gmail.com', phone: '081344556677', role: 'OWNER', unit: 'AA1409', proxyUnit: 'AA1410', type: 'owner', nik: '3175084910860001', npwp: '78.901.234.5-054.000' },
  { name: 'Joko Widodo', email: 'joko.widodo@holding.co.id', phone: '081122334455', role: 'OWNER', unit: 'AB2201', type: 'owner', nik: '3372012106610001', npwp: '90.123.456.7-057.000' },
  { name: 'Kartika Sari', email: 'kartika.sari@kuliner.com', phone: '081733445566', role: 'RENTER', unit: 'AC1804', type: 'renter', nik: '3273055203840005', npwp: '01.234.567.8-060.000' },
  { name: 'Lukman Hakim', email: 'lukman.hakim@lawfirm.id', phone: '081855667788', role: 'OWNER', unit: 'AD0407', type: 'owner', nik: '3174021807790008', npwp: '23.456.789.0-063.000' },
  { name: 'Maya Angelia', email: 'maya.angelia@design.io', phone: '081966778899', role: 'RENTER', unit: 'AE0901', type: 'renter', nik: '3173036509920003', npwp: '45.678.901.2-066.000' },
  { name: 'Nugroho Prasetyo', email: 'nugroho.p@techventure.com', phone: '081277889900', role: 'OWNER', unit: 'AF0706', type: 'owner', nik: '3174011212810006', npwp: '67.890.123.4-069.000' }
];

export const MOCK_TENANTS = Array.from({ length: 100 }, (_, i) => {
  const base = BASE_NAMES[i % BASE_NAMES.length];
  const id = i + 1;
  const towerCode = ['A', 'B', 'C', 'D'][i % 4];
  const floor = (1 + (i % 30)).toString().padStart(2, '0');
  const unitNumber = (1 + (i % 12)).toString().padStart(2, '0');
  const primaryUnitCode = `${towerCode}${floor}${unitNumber}`;

  // Common identity attributes
  const phone = base.phone || `0812${(10000000 + i * 739).toString().slice(0, 8)}`;
  const nik = base.nik || `317405${(1000000000 + i * 3917).toString().slice(0, 10)}`;
  const npwp = base.npwp || `09.${(100 + i).toString()}.${(200 + i).toString()}.${i % 9}-012.000`;
  const citizenship = 'Indonesian (WNI)';
  const province = 'DKI Jakarta';
  const ktpAddress = `Jl. Jend. Sudirman Kav. ${40 + (i % 30)}, Kel. Karet Semanggi, Kec. Setiabudi, Jakarta Selatan`;
  const postalCode = '12190';

  const emergencyContact = {
    name: i % 2 === 0 ? 'Siti Rahmawati' : 'Budi Santoso',
    nik: `317405${(2000000000 + i * 1489).toString().slice(0, 10)}`,
    relationship: i % 3 === 0 ? 'Spouse' : i % 3 === 1 ? 'Parent' : 'Sibling',
    phone: `0812${(80000000 + i * 421).toString().slice(0, 8)}`,
    ktpAddress: ktpAddress,
    currentAddress: 'Same as KTP Address'
  };

  const members = [
    {
      id: 1,
      name: i % 2 === 0 ? 'Siti Rahmawati' : 'Dewi Anggraini',
      relationship: 'Spouse',
      nik: `317405${(2000000000 + i * 1489).toString().slice(0, 10)}`,
      email: i % 2 === 0 ? 'siti.rahmawati@gmail.com' : 'dewi.anggraini@yahoo.com',
      phone: `0812${(80000000 + i * 421).toString().slice(0, 8)}`,
      accessCard: `AC-${1000 + i}`,
      status: 'Active'
    },
    {
      id: 2,
      name: 'Rian Pratama',
      relationship: 'Child',
      nik: `317405${(3000000000 + i * 1489).toString().slice(0, 10)}`,
      email: 'rian.pratama@gmail.com',
      phone: '—',
      accessCard: `AC-${2000 + i}`,
      status: i % 4 === 0 ? 'Pending' : 'Active'
    }
  ];

  const vehicles = [
    {
      id: 1,
      plate: `B ${1000 + (i * 37) % 8999} PRO`,
      type: 'Car',
      brand: i % 2 === 0 ? 'Toyota Camry Hybrid' : 'Honda CR-V Turbo',
      color: i % 2 === 0 ? 'Black Metallic' : 'Pearl White',
      slot: `B1-${(10 + (i % 50)).toString().padStart(3, '0')}`,
      rfid: `RF-${90000 + i}`
    },
    {
      id: 2,
      plate: `B ${3000 + (i * 59) % 6999} VIB`,
      type: 'Motorcycle',
      brand: 'Honda PCX 160',
      color: 'Matte Blue',
      slot: `M2-${(5 + (i % 40)).toString().padStart(3, '0')}`,
      rfid: `RF-${80000 + i}`
    }
  ];

  // Case 0: Aldi Mahardiansyah (index 0) with AC0906 (Occupant) and C0303 (Unoccupied)
  if (i === 0) {
    return {
      id,
      name: base.name,
      email: base.email,
      phone,
      nik,
      npwp,
      citizenship,
      province,
      ktpAddress,
      postalCode,
      emergencyContact,
      members,
      vehicles,
      units: [
        { role: 'RENTER', code: 'AC0906', tower: 'Tower A', handoverDate: '15 Jan 2022', status: 'Occupant' },
        { role: 'RENTER', code: 'C0303', tower: 'Tower C', handoverDate: '10 Feb 2023', status: 'Unoccupied' }
      ],
      type: 'renter'
    };
  }

  // Case 1: 4 Units Assigned for Christina Sudjie (index 1) - showcases multi-unit wrap downwards
  if (i === 1) {
    return {
      id,
      name: 'Christina Sudjie',
      email: 'christina.sudjie@gmail.com',
      phone: '081199887766',
      nik,
      npwp,
      citizenship,
      province,
      ktpAddress,
      postalCode,
      emergencyContact,
      members,
      vehicles,
      units: [
        { 
          role: 'OWNER', 
          code: 'AF0208', 
          tower: 'Tower A', 
          handoverDate: '12 Jan 2022', 
          status: 'Occupant',
          members: [
            { id: 101, name: 'Siti Rahmawati', relationship: 'Spouse', nik: '3174052000000001', email: 'siti.rahmawati@gmail.com', phone: '081280000001', accessCard: 'AC-1001', status: 'Active' },
            { id: 102, name: 'Rian Pratama', relationship: 'Child', nik: '3174053000000001', email: 'rian.pratama@gmail.com', phone: '—', accessCard: 'AC-2001', status: 'Active' }
          ]
        },
        { 
          role: 'OWNER', 
          code: 'AF0207', 
          tower: 'Tower A', 
          handoverDate: '15 Mar 2022', 
          status: 'Occupant',
          members: [
            { id: 103, name: 'Budi Sudjie', relationship: 'Renter', nik: '3174054000000001', email: 'budi.sudjie@gmail.com', phone: '081299112233', accessCard: 'AC-1002', rentalPeriod: 12, startRent: '15/03/2026', endRentDate: '15 Mar 2027', status: 'Active' }
          ]
        },
        { 
          role: 'PROXY', 
          code: 'AA0708', 
          tower: 'Tower A', 
          handoverDate: '01 Jun 2023', 
          status: 'Occupant',
          members: [
            { id: 104, name: 'Dewi Anggraini', relationship: 'Renter', nik: '3174055000000001', email: 'dewi.anggraini@yahoo.com', phone: '081377889900', accessCard: 'AC-1003', rentalPeriod: 12, startRent: '01/06/2026', endRentDate: '01 Jun 2027', status: 'Pending' }
          ]
        },
        { 
          role: 'OWNER', 
          code: 'C0303', 
          tower: 'Tower C', 
          handoverDate: '10 Aug 2023', 
          status: 'Unoccupied',
          members: []
        }
      ],
      type: 'owner'
    };
  }

  // Case 1b: Asep Saepudin (Owner of Unit D0404 with 3 children: Jajang [Proxy], Aldi, Riski)
  if (base.name === 'Asep Saepudin' || i === 3) {
    const asepMembers = [
      { 
        id: 401, 
        name: 'Jajang Saepudin', 
        relationship: 'Proxy', 
        nik: '3273041505020001', 
        email: 'jajang.saepudin@gmail.com', 
        phone: '085712345678', 
        accessCard: 'AC-4001', 
        status: 'Active' 
      },
      { 
        id: 402, 
        name: 'Aldi Saepudin', 
        relationship: 'Child', 
        nik: '3273041606040002', 
        email: 'aldi.saepudin@gmail.com', 
        phone: '085723456789', 
        accessCard: 'AC-4002', 
        status: 'Active' 
      },
      { 
        id: 403, 
        name: 'Riski Saepudin', 
        relationship: 'Child', 
        nik: '3273041707060003', 
        email: 'riski.saepudin@gmail.com', 
        phone: '085734567890', 
        accessCard: 'AC-4003', 
        status: 'Active' 
      }
    ];

    return {
      id,
      name: 'Asep Saepudin',
      email: 'asep.saepudin@gmail.com',
      phone: '085798765432',
      nik: '3273041208800002',
      npwp: '56.789.012.3-021.000',
      citizenship: 'Indonesian (WNI)',
      province: 'Jawa Barat',
      ktpAddress: 'Jl. Pasirkaliki No. 44, Cicendo, Kota Bandung',
      postalCode: '40171',
      emergencyContact: {
        name: 'Jajang Saepudin',
        relationship: 'Child',
        nik: '3273041505020001',
        phone: '085712345678',
        ktpAddress: 'Jl. Pasirkaliki No. 44, Cicendo, Kota Bandung',
        currentAddress: 'Same as KTP Address'
      },
      members: asepMembers,
      vehicles: [
        {
          id: 1,
          plate: 'D 1944 ASE',
          type: 'Car',
          brand: 'Toyota Fortuner GR Sport',
          color: 'Super White',
          slot: 'B1-020',
          rfid: 'RF-93404'
        }
      ],
      units: [
        { 
          role: 'OWNER', 
          code: 'D0404', 
          tower: 'Tower D', 
          handoverDate: '10 Jan 2021', 
          status: 'Occupant',
          members: asepMembers
        }
      ],
      type: 'owner'
    };
  }

  // Case 2: 3 Units Assigned for Bambang Soeprapto (Owner with rented-out unit and unoccupied unit)
  if (base.name === 'Bambang Soeprapto' || i === 9) {
    return {
      id,
      name: 'Bambang Soeprapto',
      email: 'bambang.s@permatagroup.com',
      phone: '081290001122',
      nik,
      npwp,
      citizenship,
      province,
      ktpAddress,
      postalCode,
      emergencyContact,
      members,
      vehicles,
      units: [
        { 
          role: 'OWNER', 
          code: 'AD0802', 
          tower: 'Tower A', 
          handoverDate: '05 Jan 2021', 
          status: 'Occupant',
          members: [
            { id: 301, name: 'Ratna Soeprapto', relationship: 'Spouse', nik: '3172025000000001', email: 'ratna.soeprapto@gmail.com', phone: '081299887711', accessCard: 'AC-3001', status: 'Active' },
            { id: 302, name: 'Dimas Soeprapto', relationship: 'Child', nik: '3172026000000001', email: 'dimas.soeprapto@gmail.com', phone: '081299887722', accessCard: 'AC-3002', status: 'Active' }
          ]
        },
        { 
          role: 'OWNER', 
          code: 'AD0804', 
          tower: 'Tower A', 
          handoverDate: '20 Nov 2023', 
          status: 'Occupant',
          members: [
            { 
              id: 303, 
              name: 'Jessica Tanuwijaya', 
              relationship: 'Renter', 
              nik: '3174095804940001', 
              email: 'jessica.tan@fintech.co.id', 
              phone: '081288990011', 
              accessCard: 'AC-3003',
              rentalPeriod: 12,
              startRent: '01/03/2026',
              endRentDate: '01 Mar 2027',
              status: 'Active'
            }
          ]
        },
        { 
          role: 'OWNER', 
          code: 'C0303', 
          tower: 'Tower C', 
          handoverDate: '14 Feb 2022', 
          status: 'Unoccupied',
          members: []
        }
      ],
      type: 'owner'
    };
  }

  // Case 2b: Dedicated Tenant Renter Profile for Jessica Tanuwijaya (Renter of unit AD0804 with child Kevin Tanuwijaya)
  if (base.name === 'Jessica Tanuwijaya' || i === 10) {
    return {
      id,
      name: 'Jessica Tanuwijaya',
      email: 'jessica.tan@fintech.co.id',
      phone: '081288990011',
      nik: '3174095804940001',
      npwp: '09.876.543.2-012.000',
      citizenship: 'Indonesian (WNI)',
      province: 'DKI Jakarta',
      ktpAddress: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
      postalCode: '12190',
      emergencyContact: {
        name: 'Hendra Tanuwijaya',
        relationship: 'Parent',
        nik: '3174091203650001',
        phone: '081198765432',
        ktpAddress: 'Jl. Senopati No. 88, Kebayoran Baru, Jakarta Selatan',
        currentAddress: 'Same as KTP Address'
      },
      members: [
        {
          id: 401,
          name: 'Kevin Tanuwijaya',
          relationship: 'Child',
          nik: '3174096005200002',
          email: 'kevin.tan@gmail.com',
          phone: '—',
          accessCard: 'AC-3004',
          status: 'Active'
        }
      ],
      vehicles: [
        {
          id: 1,
          plate: 'B 1984 JKT',
          type: 'Car',
          brand: 'Mazda CX-5 GT',
          color: 'Soul Red Crystal',
          slot: 'B1-042',
          rfid: 'RF-91234'
        }
      ],
      units: [
        {
          role: 'RENTER',
          code: 'AD0804',
          tower: 'Tower A',
          handoverDate: '01 Mar 2026',
          status: 'Occupant',
          rentalPeriod: 12,
          startRent: '01/03/2026',
          endRentDate: '01 Mar 2027',
          members: [
            {
              id: 401,
              name: 'Kevin Tanuwijaya',
              relationship: 'Child',
              nik: '3174096005200002',
              email: 'kevin.tan@gmail.com',
              phone: '—',
              accessCard: 'AC-3004',
              status: 'Active'
            }
          ]
        }
      ],
      type: 'renter'
    };
  }

  // Case 2c: Dedicated Tenant Proxy Profile for Jajang Saepudin (Proxy of unit D0404 with 1 wife and 3 children)
  if (base.name === 'Jajang Saepudin' || i === 11) {
    const jajangMembers = [
      { 
        id: 501, 
        name: 'Neng Siti Saepudin', 
        relationship: 'Spouse', 
        nik: '3273045508030001', 
        email: 'neng.siti@gmail.com', 
        phone: '085788991122', 
        accessCard: 'AC-5001', 
        status: 'Active' 
      },
      { 
        id: 502, 
        name: 'Dadan Saepudin', 
        relationship: 'Child', 
        nik: '3273042001220002', 
        email: 'dadan.saepudin@gmail.com', 
        phone: '—', 
        accessCard: 'AC-5002', 
        status: 'Active' 
      },
      { 
        id: 503, 
        name: 'Lilis Saepudin', 
        relationship: 'Child', 
        nik: '3273042203240003', 
        email: 'lilis.saepudin@gmail.com', 
        phone: '—', 
        accessCard: 'AC-5003', 
        status: 'Active' 
      },
      { 
        id: 504, 
        name: 'Cecep Saepudin', 
        relationship: 'Child', 
        nik: '3273042505260004', 
        email: 'cecep.saepudin@gmail.com', 
        phone: '—', 
        accessCard: 'AC-5004', 
        status: 'Active' 
      }
    ];

    return {
      id,
      name: 'Jajang Saepudin',
      email: 'jajang.saepudin@gmail.com',
      phone: '085712345678',
      nik: '3273041505020001',
      npwp: '56.789.012.3-022.000',
      citizenship: 'Indonesian (WNI)',
      province: 'Jawa Barat',
      ktpAddress: 'Jl. Pasirkaliki No. 44, Cicendo, Kota Bandung',
      postalCode: '40171',
      emergencyContact: {
        name: 'Asep Saepudin',
        relationship: 'Parent',
        nik: '3273041208800002',
        phone: '085798765432',
        ktpAddress: 'Jl. Pasirkaliki No. 44, Cicendo, Kota Bandung',
        currentAddress: 'Same as KTP Address'
      },
      members: jajangMembers,
      vehicles: [
        {
          id: 1,
          plate: 'D 1404 PRO',
          type: 'Car',
          brand: 'Toyota Innova Zenix Hybrid',
          color: 'Attitude Black',
          slot: 'B2-014',
          rfid: 'RF-94404'
        },
        {
          id: 2,
          plate: 'D 3404 VIB',
          type: 'Motorcycle',
          brand: 'Yamaha NMAX 155',
          color: 'Matte Green',
          slot: 'M1-028',
          rfid: 'RF-84404'
        }
      ],
      units: [
        { 
          role: 'PROXY', 
          code: 'D0404', 
          tower: 'Tower D', 
          handoverDate: '10 Feb 2024', 
          status: 'Occupant',
          members: jajangMembers
        }
      ],
      type: 'proxy'
    };
  }

  // Case 3: No unit assigned for index 6 and periodic ones
  const isUnassigned = i === 6 || (i % 7 === 0 && i !== 1 && i !== 3);

  if (isUnassigned) {
    return {
      id,
      name: i < BASE_NAMES.length ? base.name : `${base.name.split(' ')[0]} ${base.name.split(' ')[1] || 'Tenant'} ${i + 1}`,
      email: i < BASE_NAMES.length ? base.email : `tenant.${i + 1}@proapps.io`,
      phone,
      nik,
      npwp,
      citizenship,
      province,
      ktpAddress,
      postalCode,
      emergencyContact,
      members: [],
      vehicles: [],
      units: [],
      type: 'unassigned'
    };
  }

  const isProxy = i % 2 === 0;
  const isOwner = base.type === 'owner' || (i % 3 === 0);
  const type = isOwner ? 'owner' : 'renter';
  const role = isOwner ? 'OWNER' : 'RENTER';

  const units = [
    { 
      role, 
      code: primaryUnitCode, 
      tower: `Tower ${towerCode}`, 
      handoverDate: '15 Jan 2022', 
      status: 'Occupant'
    }
  ];

  if (isProxy) {
    const proxyCode = `${towerCode}${floor}${((i % 12) + 2).toString().padStart(2, '0')}`;
    units.push({ 
      role: 'PROXY', 
      code: proxyCode, 
      tower: `Tower ${towerCode}`, 
      handoverDate: '20 Jun 2023', 
      status: 'Occupant'
    });
  }

  return {
    id,
    name: i < BASE_NAMES.length ? base.name : `${base.name.split(' ')[0]} ${base.name.split(' ')[1] || 'Tenant'} ${i + 1}`,
    email: i < BASE_NAMES.length ? base.email : `tenant.${i + 1}@proapps.io`,
    phone,
    nik,
    npwp,
    citizenship,
    province,
    ktpAddress,
    postalCode,
    emergencyContact,
    members,
    vehicles,
    units,
    type
  };
});

// Extract all unique units from MOCK_TENANTS
const uniqueUnitCodes = Array.from(
  new Set(
    MOCK_TENANTS.flatMap(t => t.units.map(u => u.code))
  )
).filter(Boolean).sort();

export const UNIT_OPTIONS = [
  { value: '', label: 'All Units' },
  ...uniqueUnitCodes.map(code => ({
    value: code,
    label: code
  }))
];

export class TenantModel {
  static getStats() {
    return TENANT_STATS;
  }

  static getAllTenants() {
    return MOCK_TENANTS;
  }

  static getTenantById(id) {
    const numericId = parseInt(id, 10);
    return MOCK_TENANTS.find(t => t.id === numericId) || null;
  }
}
