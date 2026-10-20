import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { buildScheduleWorkbook, protectScheduleWorkbook, scheduleWorkbookToCsv } from './workScheduleExcel';

const employees = [{ id: 'e1', nip: '0012345678901234', name: 'Test Employee', position: 'Staff', departmentId: 'd1' }];
const options = {
  employees,
  departments: [{ id: 'd1', name: 'Engineering' }],
  shifts: [{ id: 'r1', code: 'R1', name: 'Reguler 1', checkIn: '08:00', checkOut: '17:00' }, { id: 'off-holiday', code: 'LBR', offType: 'holiday' }],
  dates: ['2026-10-20', '2026-10-21']
};

describe('work schedule Excel template', () => {
  it('exports actual codes without dropdowns and protects both sheets after serialization', async () => {
    const workbook = buildScheduleWorkbook({
      ...options, readOnly: true,
      getShiftCode: (_, date) => date === options.dates[0] ? 'R1' : 'LBR'
    });
    await protectScheduleWorkbook(workbook);
    const restored = new ExcelJS.Workbook();
    await restored.xlsx.load(await workbook.xlsx.writeBuffer());
    const sheet = restored.getWorksheet('Work Schedule');
    expect(sheet.getCell('E6').value).toBe('R1');
    expect(sheet.getCell('F6').value).toBe('LBR');
    expect(sheet.getCell('E6').dataValidation).toBeUndefined();
    for (const worksheet of restored.worksheets) {
      expect(worksheet.sheetProtection.sheet).toBe(true);
      expect(worksheet.sheetProtection.hashValue).toBeTruthy();
    }
    expect(restored.getWorksheet('Shift Codes').getColumn(1).values).toContain('LBR');
  });

  it('preserves frozen identity columns, text NIP, dropdown and OFF defaults after serialization', async () => {
    const buffer = await buildScheduleWorkbook(options).xlsx.writeBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet('Work Schedule');
    expect(sheet.views[0]).toMatchObject({ state: 'frozen', xSplit: 4, ySplit: 5 });
    expect(sheet.getCell('A6').value).toBe('0012345678901234');
    expect(sheet.getCell('E5').value).toBe('2026-10-20');
    expect(sheet.getCell('F6').value).toBe('OFF');
    expect(sheet.getCell('E6').dataValidation).toMatchObject({ type: 'list', formulae: ['ScheduleShiftCodes'], errorStyle: 'stop' });
    expect(workbook.getWorksheet('Shift Codes').getColumn(1).values.slice(2)).toEqual(['OFF', 'R1']);
    expect(workbook.getWorksheet('Shift Codes').getRow(3).values.slice(3)).toEqual(['08:00', '17:00']);
    expect(workbook.getWorksheet('Shift Codes').getRow(2).values.slice(3)).toEqual(['-', '-']);
    expect(await scheduleWorkbookToCsv(buffer, employees)).toContain('e1,2026-10-21,OFF');
    sheet.getCell('E6').value = 'R1';
    expect(await scheduleWorkbookToCsv(await workbook.xlsx.writeBuffer(), employees)).toContain('e1,2026-10-20,R1');
  });

  it('rejects unknown employees and blank shift cells', async () => {
    const workbook = buildScheduleWorkbook(options);
    await expect(scheduleWorkbookToCsv(await workbook.xlsx.writeBuffer(), [])).rejects.toThrow('NIP');
    workbook.getWorksheet('Work Schedule').getCell('E6').value = '';
    await expect(scheduleWorkbookToCsv(await workbook.xlsx.writeBuffer(), employees)).rejects.toThrow('E6');
  });
});
