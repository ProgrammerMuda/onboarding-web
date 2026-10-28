/**
 * UnitModel.js - Model Layer (MVP)
 * Units are split by function (PP 13/2021 Pasal 4), not by who occupies them:
 *   hunian      residential units
 *   non_hunian  commercial units (retail, F&B, office), owner and tenant, nobody lives there
 *   non_unit    building facilities managed as a unit, always owned by P3SRS
 * Occupancy is a separate, changing field (status).
 */

export const UNIT_STORAGE_KEY = 'proapps.units.custom.v1';

export const UNIT_CATEGORIES = [
  { id: 'hunian', label: 'Residential Unit', short: 'Residential' },
  { id: 'non_hunian', label: 'Non-Residential Unit', short: 'Non-Residential' },
  { id: 'non_unit', label: 'Non-Unit', short: 'Non-Unit' }
];

export const UNIT_STATUSES = ['occupied', 'rented', 'vacant'];

// A facility is common property, so nobody lives in it: it is either rented out or not.
export const NON_UNIT_STATUSES = ['rented', 'vacant'];

export function getStatusOptions(category) {
  return category === 'non_unit' ? NON_UNIT_STATUSES : UNIT_STATUSES;
}

const STATUS_LABELS = { occupied: 'Occupied', rented: 'Rented', vacant: 'Vacant' };

export const NON_UNIT_OWNER = 'P3SRS';

export const TOWER_OPTIONS = ['Tower A', 'Tower B', 'Tower C', 'Tower D'];
export const NON_UNIT_AREAS = [...TOWER_OPTIONS, 'Podium'];


export function getStatusLabel(category, status) {
  return STATUS_LABELS[status] ?? status;
}

export const PROXY_LABEL = 'Proxy';

/**
 * Who is actually in the unit:
 *   occupied + no occupant   the owner
 *   occupied + proxy         a proxy registered under the owner
 *   rented                   the renter
 *   vacant                   nobody
 * Non-Unit facilities are only Rented (the renter is the occupant) or Vacant (no occupant).
 */
export function getOccupant(unit) {
  if (unit.status === 'vacant') return null;
  if (unit.category === 'non_unit' && unit.status !== 'rented') return null;
  if (unit.status === 'rented') return { name: unit.tenantName, role: 'tenant' };
  if (unit.occupant?.name) {
    return {
      name: unit.occupant.name,
      role: 'proxy'
    };
  }
  return { name: unit.ownerName, role: 'owner' };
}

export function getOccupantName(unit) {
  return getOccupant(unit)?.name ?? '';
}

// "Owner", "Renter", or "Proxy"
export function describeOccupant(occupant) {
  if (!occupant) return '';
  if (occupant.role === 'proxy') return PROXY_LABEL;
  return occupant.role === 'owner' ? 'Owner' : 'Renter';
}

export function initialsOf(name) {
  return String(name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

export function getCategory(id) {
  return UNIT_CATEGORIES.find((c) => c.id === id) ?? UNIT_CATEGORIES[0];
}

// Sample data until the unit API is connected. Names are placeholders.
const OWNER_POOL = [
  'Aldi Mahardiansyah', 'Amizah Nadine', 'Anisqe Adita', 'Asep Saepudin', 'Astrid Kusnadi',
  'Christina Sudjie', 'Dumaria Manurung', 'Endang Piningsih', 'Hasbu Pratama', 'Bambang Soeprapto',
  'Jessica Tanuwijaya', 'Dewi Lestari', 'Ferry Salim', 'Grace Natalie', 'Hendro Gunawan',
  'Indah Permatasari', 'Kartika Sari', 'Lukman Hakim', 'Maya Angelia', 'Nugroho Prasetyo'
];

function pickStatus(n) {
  const r = n % 10;
  if (r < 6) return 'occupied';
  if (r < 9) return 'rented';
  return 'vacant';
}

const PROXY_FIRST_NAMES = ['Rian', 'Siti', 'Budi', 'Dewi', 'Maya'];

// Every third occupied unit is lived in by a proxy registered under the owner.
function seedProxy(status, n, ownerName) {
  if (status !== 'occupied' || n % 3 !== 0) return {};
  const first = PROXY_FIRST_NAMES[n % PROXY_FIRST_NAMES.length];
  const lastName = ownerName.split(' ').slice(-1)[0];
  return { occupant: { name: `${first} ${lastName}` } };
}

function buildHunian() {
  const units = [];
  let n = 0;
  TOWER_OPTIONS.forEach((tower) => {
    const letter = tower.slice(-1);
    for (let floor = 1; floor <= 10; floor += 1) {
      for (let no = 1; no <= 8; no += 1) {
        n += 1;
        const status = pickStatus(n * 7);
        const owner = OWNER_POOL[n % OWNER_POOL.length];
        const floorLabel = String(floor).padStart(2, '0');
        units.push({
          id: `hunian-${letter}${floorLabel}${String(no).padStart(2, '0')}`,
          code: `${letter}${floorLabel}${String(no).padStart(2, '0')}`,
          category: 'hunian',
          tower,
          floor: floorLabel,
          status,
          ownerName: owner,
          ownerType: 'person',
          tenantName: status === 'rented' ? OWNER_POOL[(n + 7) % OWNER_POOL.length] : '',
          ...seedProxy(status, n, owner)
        });
      }
    }
  });
  return units;
}

function buildNonHunian() {
  const units = [];
  let n = 0;
  TOWER_OPTIONS.forEach((tower) => {
    const letter = tower.slice(-1);
    let shop = 0;
    ['GF', 'LG'].forEach((floor) => {
      for (let no = 1; no <= 4; no += 1) {
        n += 1;
        shop += 1;
        const status = pickStatus(n * 3);
        const code = `${letter}TOKO${shop}`;
        units.push({
          id: `non_hunian-${code}`,
          code,
          category: 'non_hunian',
          tower,
          floor,
          status,
          ownerName: n % 3 === 0 ? `Sample Company ${n}` : OWNER_POOL[(n + 3) % OWNER_POOL.length],
          ownerType: n % 3 === 0 ? 'company' : 'person',
          tenantName: status === 'rented' ? `Tenant Sample ${n}` : ''
        });
      }
    });
  });
  return units;
}

// Facility codes read like the shop codes: tower letter, kind, running number (ATOKO1, AKIOS1, ASTORAGE1).
// The kind only builds the code; it is not stored or shown.
const NON_UNIT_CODE_PREFIX = {
  'ATM / Bank kiosk': 'ATM',
  'Lobby kiosk': 'KIOS',
  Storage: 'STORAGE',
  'Co-working': 'COWORKING'
};

const NON_UNIT_SEED = (() => {
  const counters = {};
  return [
    ['Tower A', 'GF', 'ATM / Bank kiosk', 'rented', 'P3SRS', 'Bank Sejahtera Nusantara'],
    ['Tower B', 'GF', 'ATM / Bank kiosk', 'vacant', 'P3SRS', ''],
    ['Tower A', 'GF', 'Lobby kiosk', 'rented', 'P3SRS', 'Kopi Sudut Lobi'],
    ['Tower C', 'GF', 'Lobby kiosk', 'vacant', 'P3SRS', ''],
    ['Tower A', 'B1', 'Storage', 'rented', 'P3SRS', 'Aldi Mahardiansyah'],
    ['Tower A', 'B1', 'Storage', 'vacant', 'P3SRS', ''],
    ['Tower A', '03', 'Co-working', 'rented', 'P3SRS', 'Ruang Bersama Co-working']
  ].map(([tower, floor, kind, status, ownerName, tenantName], i) => {
    const prefix = `${tower.slice(-1)}${NON_UNIT_CODE_PREFIX[kind]}`;
    counters[prefix] = (counters[prefix] ?? 0) + 1;
    return {
      id: `non_unit-${i + 1}`,
      code: `${prefix}${counters[prefix]}`,
      category: 'non_unit',
      tower,
      floor,
      status,
      ownerName,
      ownerType: 'p3srs',
      tenantName
    };
  });
})();

// One fully filled sample unit, so the detail page can show every field. The other sample units stay blank.
const A0101_DETAIL = {
  area: 45.5,
  electricCapacity: '2200',
  waterMeterNo: '20240101',
  electricMeterNo: '31240101',
  waterMeterStart: '12.5',
  electricMeterStart: '1480',
  invoiceElectric: 'yes',
  invoiceWater: 'yes',
  npp: '0.25',
  invoiceIpl: 'yes',
  iplInterval: '1',
  bedrooms: '2'
};

export const SEED_UNITS = [...buildHunian(), ...buildNonHunian(), ...NON_UNIT_SEED].map((unit) =>
  unit.category === 'hunian' && unit.code === 'A0101' ? { ...unit, detail: A0101_DETAIL } : unit
);

export function readCustomUnits() {
  try {
    const raw = localStorage.getItem(UNIT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistCustomUnits(list) {
  try {
    localStorage.setItem(UNIT_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function countByCategory(units) {
  const counts = { hunian: 0, non_hunian: 0, non_unit: 0 };
  units.forEach((u) => {
    if (u.category in counts) counts[u.category] += 1;
  });
  return counts;
}

export function filterUnits(units, { category, tower = '', floor = '', status = '', query = '' }) {
  const q = query.trim().toLowerCase();
  return units.filter((u) => {
    if (u.category !== category) return false;
    if (tower && u.tower !== tower) return false;
    if (floor && u.floor !== floor) return false;
    if (status && u.status !== status) return false;
    if (!q) return true;
    return [u.code, u.ownerName, u.tenantName]
      .filter(Boolean)
      .some((v) => v.toLowerCase().includes(q));
  });
}

export function getFilterOptions(units, category) {
  const inCategory = units.filter((u) => u.category === category);
  const towers = [...new Set(inCategory.map((u) => u.tower))].sort();
  const floors = [...new Set(inCategory.map((u) => u.floor))].sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  return { towers, floors };
}

// Sample floor plan until floors come from the site setup: every tower has basements, lower ground,
// ground, and 10 numbered floors; the podium is shorter.
const NUMBERED_FLOORS = Array.from({ length: 10 }, (_, i) => String(i + 1).padStart(2, '0'));
const TOWER_FLOORS = ['B2', 'B1', 'LG', 'GF', ...NUMBERED_FLOORS, 'Rooftop'];
const PODIUM_FLOORS = ['B1', 'GF', '01', '02', '03', '04', '05'];

const FLOOR_NAMES = { B2: 'Basement 2', B1: 'Basement 1', LG: 'Lower Ground', GF: 'Ground Floor' };

export function getFloorLabel(floor) {
  if (/^\d+$/.test(floor)) return `Floor ${floor}`;
  return FLOOR_NAMES[floor] ? `${FLOOR_NAMES[floor]} (${floor})` : floor;
}

// Floors that exist in the chosen tower, narrowed to what the unit type can sit on.
export function getFloorOptions(category, tower) {
  if (!category || !tower) return [];
  const floors = tower === 'Podium' ? PODIUM_FLOORS : TOWER_FLOORS;
  if (category === 'hunian') return floors.filter((f) => /^\d+$/.test(f));
  if (category === 'non_hunian') return floors.filter((f) => f === 'LG' || f === 'GF');
  return floors;
}

// Number-only typing: whatever is not a digit is dropped; decimals keep one dot (a comma counts as a dot).
export function sanitizeInteger(value) {
  return String(value ?? '').replace(/\D/g, '');
}

export function sanitizeDecimal(value) {
  const cleaned = String(value ?? '').replace(',', '.').replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  return rest.length ? `${whole}.${rest.join('')}` : whole;
}

export function getEmptyDraft(category = '') {
  return {
    category,
    tower: '',
    floor: '',
    code: '',
    area: '',
    electricCapacity: '',
    waterMeterNo: '',
    electricMeterNo: '',
    waterMeterStart: '',
    electricMeterStart: '',
    npp: '',
    invoiceElectric: 'yes',
    invoiceWater: 'yes',
    invoiceIpl: 'yes',
    iplInterval: '1',
    bedrooms: '',
    ownerName: category === 'non_unit' ? NON_UNIT_OWNER : '',
    status: 'vacant',
    tenantName: '',
    occupantType: 'primary',
    memberName: ''
  };
}

// Which Unit Detail fields apply to which type of unit.
export function getDetailFields(category) {
  return {
    npp: category !== 'non_unit',
    ipl: true,
    bedrooms: category === 'hunian'
  };
}

// Same idea as Add Employee: Next stays disabled until every required field has a value.
// Format problems (duplicate name, bad numbers) are reported by validateStep when Next is pressed.
const filledValue = (v) => String(v ?? '').trim() !== '';

// Every field in Unit Detail is required, except the ones that do not apply to the unit type
// (NPP, bedrooms, IPL) and the IPL interval while IPL is off the invoice.
export function getRequiredDetailFields(draft) {
  const applies = getDetailFields(draft.category);
  return [
    ['area', 'Unit area'],
    ['electricCapacity', 'Electric capacity'],
    ['waterMeterNo', 'Water meter no'],
    ['electricMeterNo', 'Electricity meter no'],
    ['waterMeterStart', 'Initial water meter'],
    ['electricMeterStart', 'Initial electricity meter'],
    ...(applies.npp ? [['npp', 'NPP']] : []),
    ...(applies.bedrooms ? [['bedrooms', 'Number of bedroom']] : []),
    ...(applies.ipl && draft.invoiceIpl !== 'no' ? [['iplInterval', 'IPL bill interval']] : [])
  ];
}

// Same idea as Add Employee: Next stays disabled until every required field has a value.
// Format problems (duplicate name, bad numbers) are reported by validateStep when Next is pressed.
export function isUnitStepComplete(step, draft) {
  if (step === 1) return ['category', 'tower', 'floor', 'code'].every((key) => filledValue(draft[key]));
  if (step === 2) return getRequiredDetailFields(draft).every(([key]) => filledValue(draft[key]));
  return true;
}

/**
 * Applies one form change to the draft and keeps dependent fields consistent:
 * a new unit type starts a fresh draft, a new tower clears the floor,
 * and IPL off clears the interval while IPL on brings back the default of 1 month.
 */
export function applyDraftPatch(prev, patch) {
  if (patch.category && patch.category !== prev.category) {
    return { ...getEmptyDraft(patch.category), code: prev.code };
  }
  const next = { ...prev, ...patch };
  if (patch.tower !== undefined && patch.tower !== prev.tower) next.floor = '';
  if (patch.invoiceIpl !== undefined && patch.invoiceIpl !== prev.invoiceIpl) {
    next.iplInterval = patch.invoiceIpl === 'no' ? '' : '1';
  }
  return next;
}

export function validateUnitInfo(draft, existingUnits = []) {
  if (!draft.category) return 'Unit type is required.';
  if (!draft.tower) return 'Tower or area is required.';
  if (!(draft.floor || '').trim()) return 'Floor is required.';
  const code = (draft.code || '').trim();
  if (!code) return 'Unit name is required.';
  const duplicate = existingUnits.some(
    (u) => u.category === draft.category && u.code.toLowerCase() === code.toLowerCase()
  );
  if (duplicate) return `Unit name ${code} already exists in this type.`;
  return '';
}

const isNumber = (v) => v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v));

export function validateUnitDetail(draft) {
  const missing = getRequiredDetailFields(draft).find(([key]) => !filledValue(draft[key]));
  if (missing) return `${missing[1]} is required.`;

  if (!isNumber(draft.area) || Number(draft.area) <= 0) return 'Unit area must be a number above 0.';
  const numbers = [
    ['waterMeterStart', 'Initial water meter'],
    ['electricMeterStart', 'Initial electricity meter'],
    ['npp', 'NPP']
  ];
  for (const [key, label] of numbers) {
    const value = draft[key];
    if (filledValue(value) && (!isNumber(value) || Number(value) < 0)) return `${label} must be a number, 0 or more.`;
  }
  const digitsOnly = [
    ['waterMeterNo', 'Water meter no'],
    ['electricMeterNo', 'Electricity meter no'],
    ['electricCapacity', 'Electric capacity'],
    ['bedrooms', 'Number of bedroom']
  ];
  for (const [key, label] of digitsOnly) {
    const value = draft[key];
    if (filledValue(value) && !/^\d+$/.test(String(value))) return `${label} must be digits only.`;
  }
  if (getDetailFields(draft.category).ipl && draft.invoiceIpl === 'yes' && !/^[1-9]\d*$/.test(String(draft.iplInterval ?? ''))) {
    return 'IPL bill interval must be a whole number of months, 1 or more.';
  }
  return '';
}

export function validateUnitOwnership(draft) {
  if (!(draft.ownerName || '').trim()) return 'Owner is required.';
  if (draft.category === 'non_unit' && draft.ownerName !== NON_UNIT_OWNER) {
    return 'A Non-Unit is owned by P3SRS.';
  }
  if (draft.category === 'non_unit' && !NON_UNIT_STATUSES.includes(draft.status)) {
    return 'A Non-Unit is either Rented or Vacant.';
  }
  if (draft.status === 'rented' && !(draft.tenantName || '').trim()) {
    return 'Renter name is required when the unit is rented.';
  }
  if (draft.status === 'occupied' && draft.occupantType === 'proxy') {
    if (!(draft.memberName || '').trim()) return 'Proxy name is required.';
  }
  return '';
}

export function validateUnit(draft, existingUnits = []) {
  return validateUnitInfo(draft, existingUnits) || validateUnitOwnership(draft);
}

export function buildUnit(draft) {
  const category = draft.category;
  const code = draft.code.trim();
  const isNonUnit = category === 'non_unit';
  const applies = getDetailFields(category);
  const text = (v) => String(v ?? '').trim();
  const detail = {
    area: draft.area === '' || draft.area === undefined ? undefined : Number(draft.area),
    electricCapacity: text(draft.electricCapacity),
    waterMeterNo: text(draft.waterMeterNo),
    electricMeterNo: text(draft.electricMeterNo),
    waterMeterStart: text(draft.waterMeterStart),
    electricMeterStart: text(draft.electricMeterStart),
    invoiceElectric: draft.invoiceElectric || 'yes',
    invoiceWater: draft.invoiceWater || 'yes',
    ...(applies.npp ? { npp: text(draft.npp) } : {}),
    ...(applies.ipl
      ? { invoiceIpl: draft.invoiceIpl || 'yes', iplInterval: draft.invoiceIpl === 'no' ? '' : (draft.iplInterval || '1') }
      : {}),
    ...(applies.bedrooms ? { bedrooms: text(draft.bedrooms) } : {})
  };
  return {
    id: `${category}-${code}-${Date.now()}`,
    code,
    category,
    tower: draft.tower,
    floor: draft.floor.trim(),
    // Ownership is managed elsewhere: a new unit starts vacant, and only a Non-Unit has a fixed owner.
    status: draft.status || 'vacant',
    ownerName: isNonUnit ? NON_UNIT_OWNER : (draft.ownerName || '').trim(),
    ownerType: isNonUnit ? 'p3srs' : 'person',
    tenantName: draft.status === 'rented' ? (draft.tenantName || '').trim() : '',
    ...(draft.status === 'occupied' && draft.occupantType === 'proxy'
      ? { occupant: { name: draft.memberName.trim() } }
      : {}),
    detail
  };
}

const INVOICE_LABEL = { yes: 'Yes', no: 'No' };

const DETAIL_ROWS = [
  ['Unit area', 'area', (v) => `${v} m²`],
  ['Electric capacity', 'electricCapacity', (v) => `${v} VA`],
  ['Water meter no', 'waterMeterNo'],
  ['Electricity meter no', 'electricMeterNo'],
  ['Initial water meter', 'waterMeterStart'],
  ['Initial electricity meter', 'electricMeterStart'],
  ['NPP', 'npp'],
  ['Bedrooms', 'bedrooms', (v) => `${v} ${v === '1' ? 'bedroom' : 'bedrooms'}`],
  ['Electric utility on invoice', 'invoiceElectric', (v) => INVOICE_LABEL[v]],
  ['Water utility on invoice', 'invoiceWater', (v) => INVOICE_LABEL[v]],
  ['IPL on invoice', 'invoiceIpl', (v) => INVOICE_LABEL[v]],
  ['IPL bill interval', 'iplInterval', (v, d) => (d.invoiceIpl === 'no' ? 'No IPL' : `Every ${v} month${v === '1' ? '' : 's'}`)]
];

/**
 * Label/value pairs for a unit's detail. Fields that do not apply to the unit type are never listed.
 * includeEmpty keeps the applicable fields that were left blank (shown as a dash in the overview).
 */
export function getDetailRows(detail, { includeEmpty = false } = {}) {
  if (!detail) return [];
  return DETAIL_ROWS
    .filter(([, key]) => key in detail)
    .map(([label, key, format]) => {
      const raw = detail[key];
      const noIpl = key === 'iplInterval' && detail.invoiceIpl === 'no';
      const filled = (raw !== '' && raw !== undefined && raw !== null) || noIpl;
      return [label, filled ? (format ? format(String(raw ?? ''), detail) : String(raw)) : '', noIpl];
    })
    // "No IPL" only helps in the overview; the detail dialog already says IPL on invoice: No.
    .filter(([, value, noIpl]) => (includeEmpty || value) && (includeEmpty || !noIpl))
    .map(([label, value]) => [label, value]);
}

// A unit that was never given detail (the sample units) still lists every field that applies to its type, as blank.
export function getEmptyDetail(category) {
  const applies = getDetailFields(category);
  return {
    area: '',
    electricCapacity: '',
    waterMeterNo: '',
    electricMeterNo: '',
    waterMeterStart: '',
    electricMeterStart: '',
    invoiceElectric: '',
    invoiceWater: '',
    ...(applies.npp ? { npp: '' } : {}),
    ...(applies.ipl ? { invoiceIpl: '', iplInterval: '' } : {}),
    ...(applies.bedrooms ? { bedrooms: '' } : {})
  };
}

export function getUnitDetailRows(unit) {
  return getDetailRows(unit.detail ?? getEmptyDetail(unit.category), { includeEmpty: true });
}

/**
 * Sample units are fixed data, so an edit to one is stored as a copy with the same id.
 * New units first, then the sample list with any edited copies swapped in.
 */
export function mergeUnits(seed, custom) {
  const seedIds = new Set(seed.map((u) => u.id));
  const overrides = new Map(custom.filter((u) => seedIds.has(u.id)).map((u) => [u.id, u]));
  const added = custom.filter((u) => !seedIds.has(u.id));
  return [...added, ...seed.map((u) => overrides.get(u.id) ?? u)];
}

// Fills the Add form from an existing unit. Ownership is not part of the form, so it is not copied.
export function draftFromUnit(unit) {
  const base = getEmptyDraft(unit.category);
  const d = unit.detail ?? {};
  const text = (v, fallback = '') => (v === undefined || v === null ? fallback : String(v));
  return {
    ...base,
    tower: unit.tower,
    floor: unit.floor,
    code: unit.code,
    area: text(d.area),
    electricCapacity: text(d.electricCapacity),
    waterMeterNo: text(d.waterMeterNo),
    electricMeterNo: text(d.electricMeterNo),
    waterMeterStart: text(d.waterMeterStart),
    electricMeterStart: text(d.electricMeterStart),
    npp: text(d.npp),
    invoiceElectric: text(d.invoiceElectric, base.invoiceElectric),
    invoiceWater: text(d.invoiceWater, base.invoiceWater),
    invoiceIpl: text(d.invoiceIpl, base.invoiceIpl),
    iplInterval: d.invoiceIpl === 'no' ? '' : text(d.iplInterval, base.iplInterval),
    bedrooms: text(d.bedrooms)
  };
}

/**
 * What a change of unit type does to ownership, in words. Empty when nothing happens beyond the form reset.
 *   to Non-Unit        owner becomes P3SRS, and Occupied becomes Vacant (a facility is only Rented or Vacant)
 *   from Non-Unit      the owner is cleared, because P3SRS does not automatically own a home or a shop
 */
export function describeTypeChange(unit, nextCategory) {
  if (!unit || !nextCategory || unit.category === nextCategory) return '';
  if (nextCategory === 'non_unit') {
    return unit.status === 'occupied'
      ? 'The owner becomes P3SRS and the status Occupied becomes Vacant.'
      : 'The owner becomes P3SRS.';
  }
  if (unit.category === 'non_unit') return 'The owner is cleared and shows Not assigned.';
  return '';
}

// Applies an edited draft to a unit. Owner, status, and occupant are managed elsewhere and stay,
// except where a change of unit type makes them invalid (see describeTypeChange).
export function applyUnitEdit(unit, draft) {
  const built = buildUnit({ ...draft, category: draft.category || unit.category });
  const next = {
    ...unit,
    code: built.code,
    category: built.category,
    tower: built.tower,
    floor: built.floor,
    detail: built.detail
  };
  if (built.category === unit.category) return next;

  if (built.category === 'non_unit') {
    next.ownerName = NON_UNIT_OWNER;
    next.ownerType = 'p3srs';
    if (next.status === 'occupied') {
      next.status = 'vacant';
      delete next.occupant;
    }
  } else if (unit.category === 'non_unit') {
    next.ownerName = '';
    next.ownerType = 'person';
  }
  return next;
}

export function unitsToCsv(units) {
  const header = ['Code', 'Category', 'Tower', 'Floor', 'Status', 'Owner', 'Tenant', 'Occupant', 'Occupant role'];
  const esc = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const rows = units.map((u) => [
    u.code, getCategory(u.category).label, u.tower, u.floor,
    getStatusLabel(u.category, u.status), u.ownerName, u.tenantName, getOccupantName(u),
    describeOccupant(getOccupant(u))
  ]);
  return [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push('gap');
    out.push(p);
  });
  return out;
}
