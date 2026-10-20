import ExcelJS from 'exceljs';

const identityHeaders = ['NIP', 'Nama Karyawan', 'Jabatan', 'Departement'];
const employeeNumber = (employee) => String(employee.nip || employee.nik || '');
const fill = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

export function buildScheduleWorkbook({ employees, departments, shifts, dates, readOnly = false, getShiftCode }) {
  if (!dates.length || dates.length > 16380) throw new Error('Rentang tanggal melebihi batas kolom Excel.');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  const sheet = workbook.addWorksheet('Work Schedule', {
    views: [{ state: 'frozen', xSplit: 4, ySplit: 5, topLeftCell: 'E6', showGridLines: false }]
  });
  const lastColumn = dates.length + 4;
  // Keep banner merges inside the frozen pane boundary.
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'PROAPPS | WORK SCHEDULE';
  sheet.getCell('A1').font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  sheet.getRow(1).height = 28;
  sheet.mergeCells('A2:D2');
  sheet.getCell('A2').value = `${dates[0]} to ${dates.at(-1)} | ${employees.length} employees`;
  sheet.getCell('A2').font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
  sheet.mergeCells('A3:D3');
  sheet.getCell('A3').value = readOnly
    ? 'VIEW ONLY | Jadwal ekspor. Lihat informasi shift pada sheet Shift Codes.'
    : 'Pilih kode shift pada setiap tanggal. Default: OFF.';
  sheet.getCell('A3').font = { name: 'Calibri', size: 10, color: { argb: 'FF0369A1' } };
  sheet.mergeCells('A4:D4');
  sheet.getCell('A4').value = 'IDENTITAS KARYAWAN';
  if (dates.length > 1) sheet.mergeCells(4, 5, 4, lastColumn);
  sheet.getCell('E4').value = 'JADWAL KERJA';
  sheet.getRow(5).values = [...identityHeaders, ...dates];
  [24, 30, 30, 26].forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  dates.forEach((_, index) => { sheet.getColumn(index + 5).width = 15; });
  for (const rowNumber of [4, 5]) {
    sheet.getRow(rowNumber).height = 26;
    for (let column = 1; column <= lastColumn; column++) {
      const cell = sheet.getCell(rowNumber, column);
      cell.fill = fill(column <= 4 ? 'FF002B7F' : 'FF0284C7');
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: column <= 4 ? 'left' : 'center' };
    }
  }
  const codes = [...new Set(['OFF', ...shifts.filter((shift) => readOnly || (shift.isActive !== false
    && !['holiday', 'cuti_bersama'].includes(shift.offType)
    && !['off-holiday', 'off-cuti-bersama'].includes(shift.id))).map((shift) => shift.code).filter(Boolean)])];
  const reference = workbook.addWorksheet('Shift Codes');
  reference.columns = [
    { header: 'Kode Shift', width: 18 },
    { header: 'Nama Shift', width: 32 },
    { header: 'Jam Masuk', width: 18 },
    { header: 'Jam Pulang', width: 18 }
  ];
  codes.forEach((code) => {
    const shift = shifts.find((item) => item.code === code);
    reference.addRow([
      code,
      code === 'OFF' ? 'Day Off' : shift?.name,
      code === 'OFF' ? '-' : (shift?.checkIn || '-'),
      code === 'OFF' ? '-' : (shift?.checkOut || '-')
    ]);
  });
  reference.getRow(1).font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
  reference.getRow(1).eachCell((cell) => { cell.fill = fill('FF002B7F'); });
  workbook.definedNames.add(`'Shift Codes'!$A$2:$A$${codes.length + 1}`, 'ScheduleShiftCodes');
  employees.forEach((employee, index) => {
    const department = departments.find((item) => item.id === employee.departmentId)?.name || '';
    const row = sheet.addRow([employeeNumber(employee), employee.name, employee.schedulePosition || employee.position || '', department, ...dates.map((date) => readOnly ? getShiftCode(employee, date) : 'OFF')]);
    row.height = 24;
    row.eachCell((cell, column) => {
      cell.font = { name: 'Calibri', size: 10, color: { argb: column > 4 ? 'FF0369A1' : 'FF0F172A' } };
      cell.fill = fill(index % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC');
      cell.alignment = { vertical: 'middle', horizontal: column > 4 ? 'center' : 'left' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } }, right: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
      if (column === 1) cell.numFmt = '@';
      if (column > 4 && !readOnly) cell.dataValidation = {
        type: 'list', allowBlank: false, formulae: ['ScheduleShiftCodes'],
        showErrorMessage: true, errorStyle: 'stop', errorTitle: 'Kode shift tidak valid',
        error: 'Pilih kode shift dari dropdown.', showInputMessage: true,
        promptTitle: 'Kode shift', prompt: 'Pilih kode shift. OFF berarti Day Off.'
      };
    });
  });
  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: lastColumn } };
  return workbook;
}

export async function protectScheduleWorkbook(workbook) {
  const password = Array.from(globalThis.crypto.getRandomValues(new Uint32Array(4)), (value) => value.toString(16)).join('');
  for (const sheet of workbook.worksheets) {
    sheet.eachRow((row) => row.eachCell((cell) => { cell.protection = { locked: true }; }));
    await sheet.protect(password, {
      selectLockedCells: true,
      selectUnlockedCells: true,
      formatCells: false,
      formatColumns: false,
      formatRows: false,
      insertColumns: false,
      insertRows: false,
      deleteColumns: false,
      deleteRows: false,
      insertHyperlinks: false,
      sort: false,
      autoFilter: true,
      pivotTables: false
    });
  }
  return workbook;
}

export async function scheduleWorkbookToCsv(buffer, employees) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.getWorksheet('Work Schedule');
  if (!sheet || identityHeaders.some((header, index) => sheet.getCell(5, index + 1).text !== header)) {
    throw new Error('Please use the Work Schedule Excel template downloaded from the application.');
  }
  const byNumber = new Map(employees.map((employee) => [employeeNumber(employee), employee]));
  const lines = ['employee_id,date,shift_code'];
  for (let row = 6; row <= sheet.rowCount; row++) {
    if (!sheet.getRow(row).hasValues) continue;
    const employee = byNumber.get(sheet.getCell(row, 1).text.trim());
    if (!employee) throw new Error(`Baris ${row}: NIP tidak ditemukan.`);
    for (let column = 5; column <= sheet.columnCount; column++) {
      const date = sheet.getCell(5, column).text;
      const code = sheet.getCell(row, column).text.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !code || /[,\r\n]/.test(code)) {
        throw new Error(`Sel ${sheet.getCell(row, column).address}: tanggal atau kode shift tidak valid.`);
      }
      lines.push(`${employee.id},${date},${code}`);
    }
  }
  return lines.join('\n');
}
