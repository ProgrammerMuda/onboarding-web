export const PERMIT_STORAGE_KEY = 'proapps.permit-types.v1';

export const ALLOWED_DATE_OPTIONS = [
  { value: 'past', label: 'Past dates' },
  { value: 'future', label: 'Future dates' },
  { value: 'both', label: 'Both' },
];

// Calendar boundaries in Asia/Jakarta, independent of the browser's timezone.
export function getNextPermitReset(frequency, now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: 'numeric', day: 'numeric',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  const year = Number(parts.year);
  const month = Number(parts.month) - 1;
  const day = Number(parts.day);
  let next;
  if (frequency === 'daily') next = Date.UTC(year, month, day + 1);
  else if (frequency === 'weekly') {
    const weekday = new Date(Date.UTC(year, month, day)).getUTCDay();
    next = Date.UTC(year, month, day + ((8 - weekday) % 7 || 7));
  } else {
    const months = { monthly: 1, quarterly: 3, semiannual: 6, annual: 12 }[frequency];
    if (!months) return null;
    next = Date.UTC(year, (Math.floor(month / months) + 1) * months, 1);
  }
  return new Date(next - 7 * 60 * 60 * 1000);
}

export function formatPermitReset(frequency, now = new Date()) {
  const date = getNextPermitReset(frequency, now);
  return date ? new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short', year: 'numeric',
  }).format(date) : '—';
}

export const RESET_FREQUENCIES = [
  { value: 'daily', label: 'Daily', detail: 'Every day', period: 'day', resetCycleNote: 'Tomorrow • 00:00 WIB' },
  { value: 'weekly', label: 'Weekly', detail: 'Every week', period: 'week', resetCycleNote: 'Next Monday • 00:00 WIB' },
  { value: 'monthly', label: 'Monthly', detail: 'Every month', period: 'month', resetCycleNote: 'Start of next month • 00:00 WIB' },
  { value: 'quarterly', label: 'Quarterly', detail: 'Every 3 months', period: 'quarter (3 mos)', resetCycleNote: 'Start of next quarter (Q1) • 00:00 WIB' },
  { value: 'semiannual', label: 'Every 6 months', detail: 'Every 6 months', period: '6 months', resetCycleNote: 'Start of next semester (H1) • 00:00 WIB' },
  { value: 'annual', label: 'Annual', detail: 'Every year', period: 'year', resetCycleNote: 'Start of next year • 00:00 WIB' },
];

export const INITIAL_PERMIT_TYPES = [
  { id: 'permit-sick', name: 'Sick Leave', description: 'Time off to recover from illness or injury.', hasQuota: true, quota: 12, frequency: 'annual', allowedDates: 'both', isActive: true },
  { id: 'permit-personal', name: 'Personal Leave', description: 'Time off for personal appointments or errands.', hasQuota: true, quota: 1, frequency: 'monthly', allowedDates: 'future', isActive: true },
  { id: 'permit-emergency', name: 'Emergency Leave', description: 'Unexpected urgent personal or family matters.', hasQuota: true, quota: 3, frequency: 'annual', allowedDates: 'both', isActive: true },
  { id: 'permit-medical', name: 'Medical Appointment', description: 'Scheduled medical checkups or treatment.', hasQuota: true, quota: 2, frequency: 'quarterly', allowedDates: 'future', isActive: true },
  { id: 'permit-family', name: 'Family Care', description: 'Time off to care for a family member.', hasQuota: true, quota: 3, frequency: 'semiannual', allowedDates: 'both', isActive: true },
  { id: 'permit-marriage', name: 'Marriage Leave', description: 'Time off for the employee’s wedding.', hasQuota: true, quota: 3, frequency: 'annual', allowedDates: 'future', isActive: true },
  { id: 'permit-bereavement', name: 'Bereavement Leave', description: 'Time off following the loss of a family member.', hasQuota: true, quota: 3, frequency: 'annual', allowedDates: 'both', isActive: true },
  { id: 'permit-study', name: 'Study Leave', description: 'Attend classes, examinations, or professional training.', hasQuota: true, quota: 1, frequency: 'weekly', allowedDates: 'future', isActive: true },
  { id: 'permit-unpaid', name: 'Unpaid Leave', description: 'Approved time off without pay.', hasQuota: false, quota: null, frequency: null, allowedDates: 'future', isActive: true },
  { id: 'permit-business', name: 'Business Assignment', description: 'Record time away from the workplace for company duties.', hasQuota: false, quota: null, frequency: null, allowedDates: 'both', isActive: true },
];

export function validatePermitType(draft, permits) {
  if (!ALLOWED_DATE_OPTIONS.some((option) => option.value === draft.allowedDates)) return 'Select the allowed dates.';
  if (!draft.name.trim()) return 'Permit name is required.';
  if (permits.some((permit) => permit.id !== draft.id && permit.name.toLocaleLowerCase('id') === draft.name.trim().toLocaleLowerCase('id'))) {
    return 'This permit name is already in use. Choose a different name.';
  }
  if (draft.hasQuota && (!Number.isSafeInteger(Number(draft.quota)) || Number(draft.quota) < 1)) {
    return 'Quota must be a whole number of at least 1 day.';
  }
  if (draft.hasQuota && !RESET_FREQUENCIES.some((frequency) => frequency.value === draft.frequency)) {
    return 'Select a quota reset frequency.';
  }
  return '';
}
