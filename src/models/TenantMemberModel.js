/**
 * TenantMemberModel - Model Layer (MVP)
 * Flattens MOCK_TENANTS into two lists: renters and their members (family and staff employees).
 */
import { MOCK_TENANTS, parseDmy } from './TenantModel';

// Sample doors until the building's real door list is wired in.
export const DOOR_ACCESS_OPTIONS = [
  'Main lobby',
  'Tower lobby',
  'Passenger lift',
  'Unit door',
  'Basement parking',
  'Gym',
  'Swimming pool',
  'Rooftop garden',
  'Function room',
  'Service entrance'
];

// Sample access until real door grants are wired in. Everyone gets the entrances and the lift;
// residents add amenities by a stable pick from their id, and staff only get what their work needs.
const hashOf = (value) => [...String(value)].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 9973, 7);
const RESIDENT_CORE = ['Main lobby', 'Tower lobby', 'Passenger lift', 'Unit door'];
const AMENITIES = ['Basement parking', 'Gym', 'Swimming pool', 'Rooftop garden', 'Function room'];
const STAFF_DOORS = ['Main lobby', 'Passenger lift', 'Service entrance'];

export function seedDoorAccess(key, isStaff = false) {
  const picked = isStaff
    ? STAFF_DOORS
    : [...RESIDENT_CORE, ...AMENITIES.filter((_, i) => (hashOf(key) >> i) % 2 === 1).slice(0, 3)];
  return DOOR_ACCESS_OPTIONS.filter((door) => picked.includes(door));
}

export const RENT_PERIOD_MAX = 120;

// Why a rent period is refused, or '' when it is empty or fine. Empty is left to the required check.
export function rentPeriodProblem(value) {
  if (!value) return '';
  const n = Number(value);
  return n < 1 || n > RENT_PERIOD_MAX ? `Rent period is 1 to ${RENT_PERIOD_MAX} months.` : '';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-03-15" + 12 months -> "15 Mar 2027"
export function endRentDate(start, months) {
  if (!start || !months) return '';
  const [y, m, day] = start.split('-').map(Number);
  const total = (m - 1) + Number(months);
  return `${String(day).padStart(2, '0')} ${MONTHS[total % 12]} ${y + Math.floor(total / 12)}`;
}

// The seed writes dates as dd/mm/yyyy; the date input and the draft use yyyy-mm-dd.
const isoFromSeedDate = (value) => {
  const [d, m, y] = String(value ?? '').split('/');
  return y ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : '';
};

export const TENANT_MEMBER_TABS = [
  { id: 'tenant', label: 'Renter' },
  { id: 'member', label: 'Member (Family/Staff Employee)' }
];

export const MEMBER_RELATIONS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Staff'];

export const TENANT_STATUSES = ['Active', 'Unoccupied', 'Inactive'];
export const MEMBER_STATUSES = ['Active', 'Pending', 'Rejected', 'Inactive'];

const towerOfUnit = (code) => `Tower ${String(code).charAt(0)}`;

const ROLE_LABEL = { OWNER: 'Owner', RENTER: 'Renter', PROXY: 'Proxy' };

// First tenant holding the OWNER role on a unit code.
const OWNER_BY_UNIT = new Map();
MOCK_TENANTS.forEach((t) => t.units.forEach((u) => {
  if (u.role === 'OWNER' && !OWNER_BY_UNIT.has(u.code)) OWNER_BY_UNIT.set(u.code, t.name);
}));

const OWNER_POOL = [...new Set(OWNER_BY_UNIT.values())];

// Every unit has an owner. The seed only records some, so the rest get a stable pick from the owner pool.
export function ownerOfUnit(code) {
  if (OWNER_BY_UNIT.has(code)) return OWNER_BY_UNIT.get(code);
  const hash = [...String(code)].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return OWNER_POOL[hash % OWNER_POOL.length];
}

// A renter rents exactly one unit. Where the seed lists several, only the first rented unit counts.
const renterUnitOf = (tenant) => tenant.units.find((u) => u.role === 'RENTER');
const isRenter = (tenant) => Boolean(renterUnitOf(tenant));

// "15 Jan 2022" -> "2022-01-15"
function isoFromHandover(value) {
  const [d, mon, y] = String(value ?? '').split(' ');
  const m = MONTHS.indexOf(mon) + 1;
  return m ? `${y}-${String(m).padStart(2, '0')}-${d.padStart(2, '0')}` : '';
}

// Sample rent: it starts on the unit's handover date, and runs 12, 24 or 36 months by a stable pick from the unit code.
// Replace with the real lease once leases are wired in.
function seedRental(unit) {
  const period = [12, 24, 36][hashOf(unit.code) % 3];
  const start = isoFromHandover(unit.handoverDate);
  return { code: unit.code, period, start, out: endRentDate(start, period) };
}

// The seed reuses a few base people for later tenants. Each person has one ID, so a repeat gets its own.
function buildRenters() {
  const seenIds = new Set();
  return MOCK_TENANTS.filter(isRenter).map((tenant) => {
    const units = [renterUnitOf(tenant)];
    let idNumber = String(tenant.nik ?? '').replace(/\D/g, '');
    if (!idNumber || seenIds.has(idNumber)) idNumber = `31740512${String(tenant.id).padStart(8, '0')}`;
    seenIds.add(idNumber);
    return {
      id: tenant.id,
      name: tenant.name,
      email: tenant.email,
      relation: 'Penyewa',
      ownerName: ownerOfUnit(units[0].code),
      unitCodes: units.map((u) => u.code),
      towers: [...new Set(units.map((u) => towerOfUnit(u.code)))],
      status: units.some((u) => u.status === 'Occupant') ? 'Active' : 'Unoccupied',
      idType: 'KTP',
      idNumber,
      phone: String(tenant.phone ?? '').replace(/\D/g, ''),
      supportingFile: '',
      doorAccess: seedDoorAccess(`renter:${tenant.id}`),
      rentals: units.map(seedRental)
    };
  });
}

function buildMembers() {
  const rows = [];
  MOCK_TENANTS.forEach((tenant) => {
    const seen = new Set();
    const push = (member, unitCodes, role) => {
      const parentRole = ROLE_LABEL[role] ?? 'Owner';
      const owner = parentRole === 'Owner' ? '' : ownerOfUnit(unitCodes[0]);
      const key = `${tenant.id}:${member.id}:${member.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      rows.push({
        id: key,
        name: member.name,
        email: member.email,
        relation: member.relationship,
        tenantName: tenant.name,
        unitCodes,
        towers: [...new Set(unitCodes.map(towerOfUnit))],
        status: member.status,
        parentRole,
        ownerName: owner === tenant.name ? '' : owner,
        underProxy: parentRole === 'Proxy',
        isProxy: false,
        idType: 'KTP',
        idNumber: String(member.nik ?? '').replace(/\D/g, ''),
        phone: String(member.phone ?? '').replace(/\D/g, ''),
        supportingFile: '',
        doorAccess: seedDoorAccess(key, member.relationship === 'Staff'),
        ...(member.relationship === 'Renter' && member.rentalPeriod
          ? {
            rentalPeriod: member.rentalPeriod,
            startRent: isoFromSeedDate(member.startRent),
            endRentDate: member.endRentDate ?? endRentDate(isoFromSeedDate(member.startRent), member.rentalPeriod)
          }
          : {})
      });
    };
    (tenant.members || []).forEach((m) => push(m, tenant.units.map((u) => u.code), String(tenant.type).toUpperCase()));
    tenant.units.forEach((u) => {
      // Members of a second rented unit would be orphans: that unit is not rented by this person.
      if (u.role === 'RENTER' && u !== renterUnitOf(tenant)) return;
      (u.members || []).forEach((m) => push(m, [u.code], u.role));
    });
  });
  return rows;
}

export const RENTER_ROWS = buildRenters();
export const MEMBER_ROWS = buildMembers();

// Members under a proxy-held unit are counted apart from regular members; total is their sum.
export function getTenantMemberStats(members = MEMBER_ROWS) {
  const withProxy = members.filter((m) => m.underProxy).length;
  return {
    totalRenters: RENTER_ROWS.length,
    membersWithProxy: withProxy,
    regularMembers: members.length - withProxy,
    totalMembers: members.length
  };
}

export function getRowsFor(tab) {
  return tab === 'member' ? MEMBER_ROWS : RENTER_ROWS;
}

export function getRelationOptions() {
  return [...new Set([...MEMBER_RELATIONS, 'Renter', ...MEMBER_ROWS.map((m) => m.relation)])].sort();
}

export function getTowerOptions(rows) {
  return [...new Set(rows.flatMap((r) => r.towers))].sort();
}

export function filterRows(rows, { query = '', tower = '', status = '', relation = '' }) {
  const q = query.trim().toLowerCase();
  return rows.filter((r) => {
    if (tower && !r.towers.includes(tower)) return false;
    if (status && r.status !== status) return false;
    if (relation && r.relation !== relation) return false;
    if (!q) return true;
    return [r.name, r.email, r.tenantName, r.ownerName, ...r.unitCodes]
      .some((v) => String(v ?? '').toLowerCase().includes(q));
  });
}

/* ---------- Add Tenant Member wizard ---------- */

// A unit always has an owner, plus at most one of: a renter, or a proxy. Never both.
// Where the seed lists both on one unit, the renter wins.
const RENTER_BY_UNIT = new Map();
const PROXY_BY_UNIT = new Map();
MOCK_TENANTS.forEach((t) => t.units.forEach((u) => {
  if (u.role === 'RENTER' && u === renterUnitOf(t) && !RENTER_BY_UNIT.has(u.code)) RENTER_BY_UNIT.set(u.code, t.name);
  if (u.role === 'PROXY' && !PROXY_BY_UNIT.has(u.code)) PROXY_BY_UNIT.set(u.code, t.name);
}));

const ALL_UNIT_CODES = [...new Set(MOCK_TENANTS.flatMap((t) => t.units.map((u) => u.code)))];

export const UNIT_CHOICES = ALL_UNIT_CODES
  .map((code) => {
    const renterName = RENTER_BY_UNIT.get(code) ?? '';
    return {
      code,
      tower: towerOfUnit(code),
      ownerName: ownerOfUnit(code),
      renterName,
      proxyName: renterName ? '' : (PROXY_BY_UNIT.get(code) ?? '')
    };
  })
  .sort((a, b) => a.code.localeCompare(b.code));

export const getUnitChoice = (code, units = UNIT_CHOICES) => units.find((u) => u.code === code) ?? null;

// Renters and proxies saved in this session take the unit's occupant slot.
export function withNewOccupants(units, newMembers) {
  const byCode = new Map();
  newMembers.forEach((m) => {
    if ((m.relation === 'Renter' || m.isProxy) && !byCode.has(m.unitCodes[0])) byCode.set(m.unitCodes[0], m);
  });
  if (byCode.size === 0) return units;
  return units.map((u) => {
    const m = byCode.get(u.code);
    if (!m) return u;
    return m.relation === 'Renter' ? { ...u, renterName: m.name, proxyName: '' } : { ...u, renterName: '', proxyName: m.name };
  });
}

export function searchUnitChoices(query, units = UNIT_CHOICES) {
  const q = query.trim().toLowerCase();
  if (!q) return units;
  return units.filter((u) => [u.code, u.tower, u.ownerName].some((v) => v.toLowerCase().includes(q)));
}

// The three people a member can belong to on this unit, and why one is not available.
export function parentOptions(unit) {
  if (!unit) return [];
  return [
    { role: 'Owner', name: unit.ownerName, reason: '' },
    {
      role: 'Renter',
      name: unit.renterName,
      reason: unit.renterName ? '' : unit.proxyName ? 'Unit has a proxy, so it has no renter.' : 'No renter on this unit.'
    },
    {
      role: 'Proxy',
      name: unit.proxyName,
      reason: unit.proxyName ? '' : unit.renterName ? 'Unit is rented, so it has no proxy.' : 'No proxy on this unit.'
    }
  ];
}

export function parentOf(unit, role) {
  return parentOptions(unit).find((p) => p.role === role && p.name) ?? null;
}

// A unit has one occupant besides the owner: a renter or a proxy, never both.
// Proxy is not a relation: an owner's family member or staff can be made the proxy.
const unitIsFree = (unit) => Boolean(unit) && !unit.renterName && !unit.proxyName;

// Why Renter and the proxy question are missing, or '' when they are offered.
export function occupantNotice(unit) {
  if (!unit) return '';
  if (unit.renterName) return `This unit is rented by ${unit.renterName}. End the rent before registering another renter or a proxy.`;
  if (unit.proxyName) return `This unit is lived in by proxy ${unit.proxyName}. End the proxy before registering a renter or another proxy.`;
  return '';
}

// Only the owner of an unoccupied unit can bring in a renter.
export function relationsFor(code, parentRole, units = UNIT_CHOICES) {
  const unit = getUnitChoice(code, units);
  if (!parentOf(unit, parentRole)) return [];
  return parentRole === 'Owner' && unitIsFree(unit) ? [...MEMBER_RELATIONS, 'Renter'] : MEMBER_RELATIONS;
}

// The "make this member the proxy?" question: owner side, unoccupied unit, any relation except Renter.
export function canBeProxy(d, units = UNIT_CHOICES) {
  const unit = getUnitChoice(d.unitCode, units);
  return d.parentRole === 'Owner' && unitIsFree(unit) && Boolean(d.relation) && d.relation !== 'Renter';
}

// Doors a member's card can open, chosen in step 3.
export const EMPTY_MEMBER_DRAFT = {
  unitCode: '',
  parentRole: '',
  relation: '',
  isProxy: false,
  name: '',
  email: '',
  idType: 'KTP',
  idNumber: '',
  phone: '',
  file: null,
  rentalPeriod: '',
  startRent: '',
  // Editing a renter: the lease fixes unit, owner and relation; rent is set per rented unit.
  renterEdit: false,
  rentals: [],
  doorAccess: []
};

// Choices downstream depend on the unit, on whose member this is, and on the relation,
// so they reset when those change.
export function patchMemberDraft(prev, patch) {
  const next = { ...prev, ...patch };
  const changed = (key) => key in patch && patch[key] !== prev[key];
  if (changed('unitCode')) Object.assign(next, { parentRole: '', relation: '', isProxy: false });
  if (changed('parentRole')) Object.assign(next, { relation: '', isProxy: false });
  if (changed('relation') && next.relation === 'Renter') next.isProxy = false;
  if (changed('idType')) next.idNumber = '';
  // Rent details only belong to a renter.
  if (changed('relation') && next.relation !== 'Renter') Object.assign(next, { rentalPeriod: '', startRent: '' });
  return next;
}

export const digitsOnly = (value) => String(value).replace(/\D/g, '');

// KTP is exactly 16 digits. A passport number is letters and digits, 6 to 9 characters.
export const ID_TYPES = {
  KTP: { max: 16, min: 16, unit: 'digits', placeholder: 'KTP number (16 digits)', clean: (v) => digitsOnly(v).slice(0, 16) },
  Passport: { max: 9, min: 6, unit: 'characters', placeholder: 'Passport number (6 to 9 characters)', clean: (v) => String(v).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 9) }
};

export const PHONE_MAX = 15;
export const FILE_MAX_BYTES = 5 * 1024 * 1024;
const FILE_TYPES = /^(application\/pdf|image\/)/;

// Returns why a supporting file is refused, or ''.
export function supportingFileError(file) {
  if (!file) return '';
  if (!FILE_TYPES.test(file.type)) return 'Use a PDF or an image file.';
  if (file.size > FILE_MAX_BYTES) return `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 5 MB.`;
  return '';
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field problems for what has been typed so far; empty fields are left to the required check.
// Which units each ID number rents, from renters and from members whose relation is Renter.
// A person (one ID number) can rent only one unit.
export function rentingUnitsById(renters, members) {
  const map = new Map();
  const add = (id, code) => {
    if (!id) return;
    if (!map.has(id)) map.set(id, new Set());
    map.get(id).add(code);
  };
  renters.forEach((r) => r.unitCodes.forEach((code) => add(r.idNumber, code)));
  members.filter((m) => m.relation === 'Renter').forEach((m) => add(m.idNumber, m.unitCodes[0]));
  return map;
}

export function fieldErrors(d, renting = new Map()) {
  const errors = {};
  const id = ID_TYPES[d.idType];
  if (d.idNumber && (d.idNumber.length < id.min || d.idNumber.length > id.max)) {
    errors.idNumber = id.min === id.max
      ? `${d.idType} number has ${id.max} ${id.unit} (now ${d.idNumber.length}).`
      : `${d.idType} number has ${id.min} to ${id.max} ${id.unit} (now ${d.idNumber.length}).`;
  }
  if (d.phone && (d.phone.length < 9 || d.phone.length > PHONE_MAX)) errors.phone = `Phone number has 9 to ${PHONE_MAX} digits (now ${d.phone.length}).`;
  if (d.email.trim() && !EMAIL_PATTERN.test(d.email.trim())) errors.email = 'Invalid email format (e.g. name@example.com).';
  if (d.relation === 'Renter' && !d.renterEdit && d.idNumber) {
    const elsewhere = [...(renting.get(d.idNumber) ?? [])].find((code) => code !== d.unitCode);
    if (elsewhere) errors.idNumber = `This ID already rents ${elsewhere}. A renter can rent only one unit.`;
  }
  if (d.renterEdit) {
    const bad = d.rentals.find((x) => rentPeriodProblem(x.period));
    if (bad) errors.rentalPeriod = `${bad.code}: ${rentPeriodProblem(bad.period)}`;
  } else if (needsRent(d) && rentPeriodProblem(d.rentalPeriod)) {
    errors.rentalPeriod = rentPeriodProblem(d.rentalPeriod);
  }
  return errors;
}

// A renter also sets the rent period and when it starts; everyone else only gets door access.
export const needsRent = (d) => d.relation === 'Renter';

// Next stays disabled until the required fields have something in them, like Add Employee.
export function isMemberStepFilled(step, d, units = UNIT_CHOICES) {
  if (step === 1) return d.renterEdit || Boolean(parentOf(getUnitChoice(d.unitCode, units), d.parentRole) && relationsFor(d.unitCode, d.parentRole, units).includes(d.relation));
  if (step === 2) return Boolean(d.name.trim() && d.email.trim() && d.idNumber);
  if (step === 3) {
    const rentFilled = d.renterEdit ? d.rentals.every((x) => x.period && x.start) : (!needsRent(d) || Boolean(d.rentalPeriod && d.startRent));
    return rentFilled && d.doorAccess.length > 0;
  }
  if (step === 4) return [1, 2, 3].every((n) => isMemberStepFilled(n, d, units));
  return false;
}

// What pressing Next reports in the error banner: the first problem on the step, or ''.
export function memberStepError(step, d, renting) {
  const errors = fieldErrors(d, renting);
  if (step === 2) return errors.email || errors.idNumber || errors.phone || '';
  if (step === 3) return errors.rentalPeriod || '';
  return '';
}

export function isMemberStepComplete(step, d, units = UNIT_CHOICES, renting) {
  return isMemberStepFilled(step, d, units) && !memberStepError(step, d, renting);
}

// New members start as Pending: they still need approval.
export function buildMemberRow(d, id, units = UNIT_CHOICES) {
  const unit = getUnitChoice(d.unitCode, units);
  const parent = parentOf(unit, d.parentRole);
  return {
    id: `new:${id}`,
    name: d.name.trim(),
    email: d.email.trim(),
    idType: d.idType,
    idNumber: d.idNumber,
    phone: d.phone,
    supportingFile: d.file?.name ?? '',
    supportingFileSize: d.file?.size ?? 0,
    relation: d.relation,
    isProxy: canBeProxy(d, units) && d.isProxy,
    tenantName: parent.name,
    unitCodes: [unit.code],
    towers: [unit.tower],
    status: 'Pending',
    parentRole: parent.role,
    ownerName: parent.role === 'Owner' ? '' : unit.ownerName,
    underProxy: parent.role === 'Proxy',
    doorAccess: d.doorAccess,
    ...(needsRent(d)
      ? { rentalPeriod: Number(d.rentalPeriod), startRent: d.startRent, endRentDate: endRentDate(d.startRent, d.rentalPeriod) }
      : {})
  };
}

// Edits and deactivations made this session, layered over the rows.
// Approval only applies to Pending members: approve makes them Active, reject keeps the reason.
export function applyMemberEdits(rows, { edited = {}, deactivated = [], approved = [], rejected = {} }) {
  return rows.map((r) => {
    let row = edited[r.id] ?? r;
    if (row.status === 'Pending' && approved.includes(r.id)) row = { ...row, status: 'Active' };
    else if (row.status === 'Pending' && r.id in rejected) row = { ...row, status: 'Rejected', rejectReason: rejected[r.id] };
    return deactivated.includes(r.id) ? { ...row, status: 'Inactive' } : row;
  });
}

// Editing a renter or proxy must not count them as the unit's existing occupant.
export function releaseOccupant(units, member) {
  if (!member) return units;
  const code = member.unitCodes[0];
  return units.map((u) => {
    if (u.code !== code) return u;
    return {
      ...u,
      renterName: u.renterName === member.name ? '' : u.renterName,
      proxyName: u.proxyName === member.name ? '' : u.proxyName
    };
  });
}

// Wizard draft for an existing member, so Edit opens with everything filled in.
export function draftFromMember(m) {
  return {
    ...EMPTY_MEMBER_DRAFT,
    unitCode: m.unitCodes[0],
    parentRole: m.parentRole,
    relation: m.relation,
    isProxy: Boolean(m.isProxy),
    name: m.name,
    email: m.email ?? '',
    idType: m.idType ?? 'KTP',
    idNumber: m.idNumber ?? '',
    phone: m.phone ?? '',
    file: m.supportingFile ? { name: m.supportingFile, size: m.supportingFileSize ?? 0, type: '' } : null,
    rentalPeriod: m.rentalPeriod ? String(m.rentalPeriod) : '',
    startRent: m.startRent ?? '',
    doorAccess: m.doorAccess ?? []
  };
}

// Pending rows first so they get approved; order is otherwise unchanged.
export function pendingFirst(rows) {
  return [...rows.filter((r) => r.status === 'Pending'), ...rows.filter((r) => r.status !== 'Pending')];
}

// Edit wizard for a renter: the lease is shown locked in step 1; identity, rent and doors are editable.
export function draftFromRenter(r) {
  return {
    ...EMPTY_MEMBER_DRAFT,
    renterEdit: true,
    unitCode: r.unitCodes[0],
    parentRole: 'Owner',
    relation: 'Renter',
    rentals: (r.rentals ?? []).map((x) => ({ code: x.code, period: String(x.period), start: x.start })),
    doorAccess: r.doorAccess ?? [],
    name: r.name,
    email: r.email ?? '',
    idType: r.idType ?? 'KTP',
    idNumber: r.idNumber ?? '',
    phone: r.phone ?? '',
    file: r.supportingFile ? { name: r.supportingFile, size: r.supportingFileSize ?? 0, type: '' } : null
  };
}

export function applyRenterDraft(r, d) {
  return {
    ...r,
    name: d.name.trim(),
    email: d.email.trim(),
    idType: d.idType,
    idNumber: d.idNumber,
    phone: d.phone,
    supportingFile: d.file?.name ?? '',
    supportingFileSize: d.file?.size ?? 0,
    doorAccess: d.doorAccess,
    rentals: d.rentals.map((x) => ({
      code: x.code,
      period: Number(x.period),
      start: x.start,
      out: endRentDate(x.start, x.period)
    }))
  };
}

// Change one rented unit's period or start date in a renter edit draft.
export function patchRental(draft, index, patch) {
  return { ...draft, rentals: draft.rentals.map((x, i) => (i === index ? { ...x, ...patch } : x)) };
}

// A renamed renter keeps their members: member rows follow the new name.
export function followRenames(members, renames) {
  if (Object.keys(renames).length === 0) return members;
  return members.map((m) => (renames[m.tenantName] ? { ...m, tenantName: renames[m.tenantName] } : m));
}

// What a member is, in one phrase: "Renter", "Spouse (Proxy)", or just the relation ("Child").
export function memberTypeLabel(m) {
  if (m.relation === 'Renter') return 'Renter';
  return m.isProxy ? `${m.relation} (Proxy)` : m.relation;
}

// Who owns the member's unit: the parent themselves when the member belongs to the owner.
export const unitOwnerOf = (m) => (m.parentRole === 'Owner' ? m.tenantName : m.ownerName);

// ----------------------------------------------------
// Import from the Renter and Member templates. Each row becomes a draft and goes through the
// Add Tenant Member rules: who the unit lets in, proxy, ID format, one rented unit per ID, rent and doors.
// Later rows see the renters and proxies of earlier rows, like members saved one after another.
// ----------------------------------------------------

const pickOption = (value, options) => options.find((o) => o.toLowerCase() === String(value ?? '').trim().toLowerCase()) ?? '';
const isoFromDmy = (value) => {
  const date = parseDmy(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

function rowProblem(kind, raw, d, unit, units, renting) {
  const isRenter = kind === 'renter';
  if (!d.unitCode) return 'Unit code is required.';
  if (!unit) return `Unit ${d.unitCode} is not registered in Tenant Member.`;
  if (isRenter) {
    if (!relationsFor(d.unitCode, 'Owner', units).includes('Renter')) return occupantNotice(unit) || `Unit ${d.unitCode} cannot take a renter.`;
  } else {
    if (!d.parentRole) return raw.memberOf ? `Member of "${raw.memberOf}" must be Owner, Renter, or Proxy.` : 'Member of is required.';
    const parent = parentOptions(unit).find((p) => p.role === d.parentRole);
    if (!parent.name) return `${d.unitCode}: ${parent.reason}`;
    if (!d.relation) return raw.relation ? `Member relation "${raw.relation}" must be one of ${MEMBER_RELATIONS.join(', ')}.` : 'Member relation is required.';
    if (raw.proxy && !['yes', 'no'].includes(raw.proxy.toLowerCase())) return 'Proxy must be Yes or No.';
    if (d.isProxy && !canBeProxy(d, units)) {
      return d.parentRole !== 'Owner' ? 'Only a member of the Owner can be the proxy.' : (occupantNotice(unit) || 'This unit cannot take a proxy.');
    }
  }
  if (!d.name.trim()) return 'Full name is required.';
  if (!d.email.trim()) return 'Email is required.';
  if (!d.idType) return 'ID type must be KTP or Passport.';
  if (!d.idNumber) return 'ID number is required.';
  if (d.idType === 'KTP' && !/^\d+$/.test(d.idNumber)) return 'KTP number uses digits only.';
  if (d.idType === 'Passport' && !/^[A-Z0-9]+$/.test(d.idNumber)) return 'Passport number uses letters and digits only.';
  const errors = fieldErrors(d, renting);
  if (errors.email || errors.idNumber || errors.phone) return errors.email || errors.idNumber || errors.phone;
  if (isRenter) {
    if (!raw.rentalPeriod) return 'Rent period is required for a renter.';
    if (!/^\d+$/.test(raw.rentalPeriod)) return 'Rent period must be a whole number of months.';
    if (errors.rentalPeriod) return errors.rentalPeriod;
    if (!raw.startRent) return 'Start rent is required for a renter.';
    if (!d.startRent) return `Start rent "${raw.startRent}" is not a date in DD/MM/YYYY.`;
  }
  if (!raw.doorAccess) return 'Door access needs at least one door.';
  const unknown = raw.doorAccess.split(',').map((s) => s.trim()).filter(Boolean).find((door) => !pickOption(door, DOOR_ACCESS_OPTIONS));
  if (unknown) return `Door "${unknown}" is not one of the doors. See the Reference sheet for the list.`;
  return '';
}

/**
 * `kind` is 'renter' or 'member'. `units` and `renting` are what the wizard sees right now.
 * Returns { members, errors }; members are rows ready for the Member list (Pending), ids from `firstId`.
 */
export function importRowsToMembers(rows, kind, { units = UNIT_CHOICES, renting = new Map(), firstId = 1 } = {}) {
  const isRenter = kind === 'renter';
  let unitsNow = units;
  const rentingNow = new Map([...renting].map(([id, codes]) => [id, new Set(codes)]));
  const members = [];
  const errors = [];

  rows.forEach(({ rowNumber, values }) => {
    const raw = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, String(v ?? '').trim()]));
    const idType = pickOption(raw.idType, Object.keys(ID_TYPES));
    const d = {
      ...EMPTY_MEMBER_DRAFT,
      unitCode: (raw.unitCode || '').toUpperCase(),
      parentRole: isRenter ? 'Owner' : pickOption(raw.memberOf, ['Owner', 'Renter', 'Proxy']),
      relation: isRenter ? 'Renter' : pickOption(raw.relation, MEMBER_RELATIONS),
      isProxy: !isRenter && (raw.proxy || '').toLowerCase() === 'yes',
      name: raw.name || '',
      email: raw.email || '',
      idType,
      idNumber: (raw.idNumber || '').replace(/\s/g, '').toUpperCase(),
      phone: digitsOnly(raw.phone || ''),
      rentalPeriod: isRenter ? (raw.rentalPeriod || '') : '',
      startRent: isRenter ? isoFromDmy(raw.startRent) : '',
      doorAccess: DOOR_ACCESS_OPTIONS.filter((door) => (raw.doorAccess || '').split(',').some((s) => s.trim().toLowerCase() === door.toLowerCase()))
    };
    const unit = getUnitChoice(d.unitCode, unitsNow);
    const problem = rowProblem(kind, raw, d, unit, unitsNow, rentingNow);
    if (problem) {
      errors.push({ rowNumber, message: problem });
      return;
    }
    const row = buildMemberRow(d, firstId + members.length, unitsNow);
    members.push(row);
    unitsNow = withNewOccupants(unitsNow, [row]);
    if (isRenter) {
      if (!rentingNow.has(d.idNumber)) rentingNow.set(d.idNumber, new Set());
      rentingNow.get(d.idNumber).add(d.unitCode);
    }
  });

  return { members, errors };
}
