import { CalendarStar, Coffee, Sun, SunHorizon, Moon } from '@phosphor-icons/react';

/**
 * Determine period badge metadata (icon, label, colors) based on shift clock-in time and period.
 */
export function getShiftPeriodInfo(shift, isOff) {
  if (shift?.id === 'off-cuti-bersama' || shift?.offType === 'cuti_bersama') {
    return {
      label: 'Collective Leave',
      Icon: CalendarStar,
      bg: '#EFF6FF',
      color: '#1E40AF',
      border: '#BFDBFE',
      isHoliday: true
    };
  }

  if (shift?.id === 'off-holiday' || shift?.offType === 'holiday') {
    return {
      label: 'National Holiday',
      Icon: CalendarStar,
      bg: '#FEE2E2',
      color: '#B91C1C',
      border: '#FECDD3',
      isHoliday: true
    };
  }

  if (isOff || shift?.id === 'off') {
    return {
      label: 'Off',
      Icon: Coffee,
      bg: '#F1F5F9',
      color: '#475569',
      border: '#E2E8F0',
      isOffDay: true
    };
  }

  const checkIn = shift?.checkIn || '';
  const [hStr] = checkIn.split(':');
  const h = parseInt(hStr, 10);

  let period = shift?.period;
  if (!period && !isNaN(h)) {
    if (h >= 5 && h < 12) period = 'pagi';
    else if (h >= 12 && h < 19) period = 'siang';
    else period = 'malam';
  }

  if (period === 'pagi' || (!isNaN(h) && h >= 5 && h < 12)) {
    return {
      label: 'Morning',
      Icon: Sun,
      bg: '#FEF3C7',
      color: '#B45309',
      border: 'rgba(217, 119, 6, 0.25)'
    };
  }

  if (period === 'siang' || period === 'sore' || (!isNaN(h) && h >= 12 && h < 19)) {
    return {
      label: 'Afternoon',
      Icon: SunHorizon,
      bg: '#FFEDD5',
      color: '#C2410C',
      border: 'rgba(194, 65, 12, 0.25)'
    };
  }

  return {
    label: 'Night',
    Icon: Moon,
    bg: '#EEF2FF',
    color: '#4338CA',
    border: 'rgba(67, 56, 202, 0.25)'
  };
}
