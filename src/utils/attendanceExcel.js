import ExcelJS from 'exceljs';
import { addListSheet } from './tenantMemberExcel';
import {
  buildDayRows,
  formatHm,
  formatLogDate,
  listDates,
  summarizeLogs
} from '../models/AttendanceReportModel';

// Monthly attendance workbook: a Summary sheet with one line per employee, then one sheet per employee with
// the same totals on top and every date of the period below. Styled like the Work Schedule and list exports.

const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const GROUP_FILLS = ['FF002B7F', 'FF0284C7'];
const GREEN = 'FF166534';
const AMBER = 'FF92400E';
const RED = 'FFB91C1C';
const STATUS_COLORS = {
  'Early In': GREEN, 'On Time In': GREEN, 'On Time Out': GREEN,
  Late: AMBER, 'Early Out': AMBER,
  Alpha: RED, 'No Clock Out': RED
};

const SUMMARY_SHEET = {
  name: 'Attendance Summary',
  noun: 'employees',
  title: 'PROAPPS | REPORT ATTENDANCE',
  groups: [
    { label: 'EMPLOYEE', columns: [
      ['NIP', 20, (e) => e.nip, 'text'],
      ['Employee', 28, (e) => e.name],
      ['Position', 'fit', (e) => e.role],
      ['Department', 'fit', (e) => e.department]
    ] },
    { label: 'WORK HOURS', columns: [
      ['Expected Hours', 16, (e) => formatHm(e.sum.expectedMinutes), 'number'],
      ['Total Work Hours', 16, (e) => formatHm(e.sum.workedMinutes), 'number'],
      ['Work Days', 12, (e) => e.sum.workDays, 'number'],
      ['Off Days', 12, (e) => e.sum.offDays, 'number'],
      ['Calendar Days', 14, (e) => e.sum.calendarDays, 'number']
    ] },
    { label: 'ATTENDANCE', columns: [
      ['Late', 10, (e) => e.sum.lateCount, 'number'],
      ['Late Total', 12, (e) => formatHm(e.sum.lateMinutes), 'number'],
      ['Early Out', 12, (e) => e.sum.earlyOutCount, 'number'],
      ['Early Out Total', 16, (e) => formatHm(e.sum.earlyOutMinutes), 'number'],
      ['No Clock Out', 14, (e) => e.sum.noClockOut, 'number'],
      ['Alpha', 10, (e) => e.sum.alpha, 'number']
    ] },
    { label: 'PERMISSION', columns: [
      ['Overtime BKO', 14, (e) => e.sum.overtimeBko, 'number'],
      ['Overtime Staff', 16, (e) => formatHm(e.sum.overtimeStaffMinutes), 'number'],
      ['Leave Permit', 14, (e) => e.sum.leave, 'number'],
      ['Change Shift', 14, (e) => e.sum.changeShift, 'number'],
      ['Manual Attendance', 18, (e) => e.sum.manual, 'number']
    ] }
  ]
};

const DAY_GROUPS = [
  { label: 'DATE', columns: [['Date', 14], ['Day', 13]] },
  { label: 'SHIFT', columns: [['Shift', 28], ['Shift Hours', 14]] },
  { label: 'ATTENDANCE', columns: [['Check In', 16], ['Check Out', 16], ['Total Work Duration', 20]] },
  { label: 'STATUS', columns: [['Check In Status', 18], ['Check Out Status', 18]] },
  { label: 'PERMISSION', columns: [['Permission', 52]] }
];

const border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };

// Sheet names hold 31 characters and none of : \ / ? * [ ].
function sheetNameFor(employee, taken) {
  const base = `${employee.nip} - ${employee.name}`.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31).trim();
  let name = base;
  for (let n = 2; taken.has(name.toLowerCase()); n += 1) name = `${base.slice(0, 31 - String(n).length - 1)} ${n}`;
  taken.add(name.toLowerCase());
  return name;
}

function addEmployeeSheet(workbook, employee, period, exportedOn, taken) {
  const today = exportedOn;
  const { dates } = employee;
  const sheet = workbook.addWorksheet(sheetNameFor(employee, taken), { views: [{ showGridLines: false }] });
  const columns = DAY_GROUPS.flatMap((g) => g.columns);
  const lastColumn = columns.length;
  columns.forEach(([, width], index) => { sheet.getColumn(index + 1).width = width; });

  sheet.mergeCells(1, 1, 1, 6);
  sheet.getCell('A1').value = `PROAPPS | ATTENDANCE | ${employee.name}`;
  sheet.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  sheet.getRow(1).height = 28;
  sheet.mergeCells(2, 1, 2, 6);
  sheet.getCell('A2').value = `NIP ${employee.nip} | ${employee.role} | ${employee.department}`;
  sheet.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
  sheet.mergeCells(3, 1, 3, 6);
  sheet.getCell('A3').value = `VIEW ONLY | ${period} | ${employee.filterText} | Exported ${exportedOn}`;
  sheet.getCell('A3').font = { name: 'Calibri', size: 10, color: { argb: 'FF0369A1' } };

  // Summary: a band, then two strips of label over value.
  sheet.mergeCells(4, 1, 4, lastColumn);
  sheet.getCell('A4').value = 'SUMMARY';
  const strips = [
    [
      ['Expected Hours', formatHm(employee.sum.expectedMinutes)],
      ['Total Work Hours', formatHm(employee.sum.workedMinutes)],
      ['Work Days', employee.sum.workDays],
      ['Off Days', employee.sum.offDays],
      ['Calendar Days', employee.sum.calendarDays],
      ['Late', `${employee.sum.lateCount} (${formatHm(employee.sum.lateMinutes)})`],
      ['Early Out', `${employee.sum.earlyOutCount} (${formatHm(employee.sum.earlyOutMinutes)})`],
      ['No Clock Out', employee.sum.noClockOut],
      ['Alpha', employee.sum.alpha]
    ],
    [
      ['Overtime BKO', employee.sum.overtimeBko],
      ['Overtime Staff', formatHm(employee.sum.overtimeStaffMinutes)],
      ['Leave Permit', employee.sum.leave],
      ['Change Shift', employee.sum.changeShift],
      ['Manual Attendance', employee.sum.manual]
    ]
  ];
  strips.forEach((strip, index) => {
    const labelRow = 5 + index * 2;
    strip.forEach(([label, value], i) => {
      const labelCell = sheet.getCell(labelRow, i + 1);
      labelCell.value = label;
      labelCell.fill = fill('FF0284C7');
      labelCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      labelCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      const valueCell = sheet.getCell(labelRow + 1, i + 1);
      valueCell.value = value;
      valueCell.fill = fill('FFF8FAFC');
      valueCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };
      valueCell.alignment = { vertical: 'middle', horizontal: 'center' };
      valueCell.border = border;
    });
    sheet.getRow(labelRow).height = 28;
    sheet.getRow(labelRow + 1).height = 26;
  });

  // Daily record: group bands, then the column headers in each band's color.
  const bandRow = 10;
  const headerRow = 11;
  let start = 1;
  const bandOf = [];
  DAY_GROUPS.forEach((group, index) => {
    const end = start + group.columns.length - 1;
    if (end > start) sheet.mergeCells(bandRow, start, bandRow, end);
    sheet.getCell(bandRow, start).value = group.label;
    for (let c = start; c <= end; c++) bandOf[c] = GROUP_FILLS[index % GROUP_FILLS.length];
    start = end + 1;
  });
  sheet.getRow(headerRow).values = columns.map(([header]) => header);
  for (const rowNumber of [4, bandRow, headerRow]) {
    sheet.getRow(rowNumber).height = 26;
    for (let column = 1; column <= lastColumn; column++) {
      const cell = sheet.getCell(rowNumber, column);
      cell.fill = fill(rowNumber === 4 ? GROUP_FILLS[0] : bandOf[column]);
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    }
  }

  buildDayRows(employee.logs, dates, today).forEach((day, index) => {
    const row = sheet.addRow([
      day.date, day.weekday, day.shift, day.shiftHours, day.checkIn, day.checkOut, day.total,
      day.inStatus, day.outStatus, day.permission
    ]);
    row.height = 24;
    row.eachCell({ includeEmpty: true }, (cell, column) => {
      const isStatus = column === 8 || column === 9;
      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: isStatus && Boolean(STATUS_COLORS[cell.value]),
        color: { argb: isStatus ? (STATUS_COLORS[cell.value] ?? 'FF0F172A') : 'FF0F172A' }
      };
      cell.fill = fill(index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC');
      cell.alignment = { vertical: 'middle', horizontal: column >= 4 && column <= 7 ? 'center' : 'left' };
      cell.border = border;
      if (column === 1) cell.numFmt = '@';
    });
  });

  sheet.autoFilter = { from: { row: headerRow, column: 1 }, to: { row: headerRow, column: lastColumn } };
  return sheet;
}

// `logs` are the decorated rows to export. By default each employee gets every date of the period. With
// `onlyLoggedDays` (a shift filter is on) they get just the days in `logs`, so days of other shifts are
// not shown as days off. `filterText` says which filters were on, and is printed on every sheet.
export function buildAttendanceWorkbook({ logs, from, to, exportedOn, filterText = 'No filters', onlyLoggedDays = false }) {
  const allDates = listDates(from, to);
  const byNip = new Map();
  logs.forEach((r) => {
    const entry = byNip.get(r.nip) || { nip: r.nip, name: r.name, role: r.role, department: r.departmentName || '', logs: [] };
    entry.logs.push(r);
    byNip.set(r.nip, entry);
  });
  const employees = [...byNip.values()]
    .map((e) => {
      const dates = onlyLoggedDays ? [...new Set(e.logs.map((r) => r.date))].sort() : allDates;
      return { ...e, dates, filterText, sum: summarizeLogs(e.logs, dates, exportedOn) };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const period = `${formatLogDate(from)} to ${formatLogDate(to)}`;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  addListSheet(workbook, {
    ...SUMMARY_SHEET,
    note: `VIEW ONLY | ${period} | ${filterText}. Each employee has a sheet of their own with the daily record.`
  }, employees, exportedOn);
  const taken = new Set([SUMMARY_SHEET.name.toLowerCase()]);
  employees.forEach((employee) => addEmployeeSheet(workbook, employee, period, exportedOn, taken));
  return workbook;
}
