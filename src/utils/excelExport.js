import ExcelJS from 'exceljs';

/**
 * Triggers a browser download of an ExcelJS workbook as a .xlsx file.
 * Returns the buffer in non-browser/SSR environments.
 *
 * @param {ExcelJS.Workbook} workbook
 * @param {string} fileName
 */
export async function downloadWorkbook(workbook, fileName) {
  const buffer = await workbook.xlsx.writeBuffer();
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return buffer;
  }

  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
  return buffer;
}

// Calculate age from date of birth
function calculateAge(dob) {
  if (!dob) return '32 Years';
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return '32 Years';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age > 0 ? `${age} Years` : '32 Years';
}

/**
 * Comprehensive Column Specifications matching the full Employee Profile view
 */
const COMPREHENSIVE_COLUMNS = [
  // Index
  { header: 'No.', key: 'no', width: 6, align: 'center', group: 'INDEX' },

  // Personal Information & Identity
  { header: 'Employee NIP', key: 'nip', width: 20, align: 'center', isString: true, group: 'PERSONAL' },
  { header: 'Full Name', key: 'name', width: 26, align: 'left', isBold: true, group: 'PERSONAL' },
  { header: 'Email Address', key: 'email', width: 30, align: 'left', group: 'PERSONAL' },
  { header: 'Mobile Phone', key: 'phone', width: 18, align: 'center', group: 'PERSONAL' },
  { header: 'Gender', key: 'gender', width: 12, align: 'center', group: 'PERSONAL' },
  { header: 'NIK (ID Card / KTP)', key: 'ktp', width: 22, align: 'center', isString: true, group: 'PERSONAL' },
  { header: 'Tax Number (NPWP)', key: 'npwp', width: 22, align: 'center', isString: true, group: 'PERSONAL' },
  { header: 'Religion', key: 'religion', width: 14, align: 'center', group: 'PERSONAL' },
  { header: 'Marital Status', key: 'maritalStatus', width: 15, align: 'center', group: 'PERSONAL' },
  { header: 'Nationality', key: 'citizenship', width: 16, align: 'center', group: 'PERSONAL' },
  { header: 'Place of Birth', key: 'birthPlace', width: 18, align: 'left', group: 'PERSONAL' },
  { header: 'Date of Birth', key: 'dob', width: 16, align: 'center', group: 'PERSONAL' },
  { header: 'Age', key: 'age', width: 12, align: 'center', group: 'PERSONAL' },

  // Address
  { header: 'Current Address', key: 'domicileAddress', width: 38, align: 'left', group: 'ADDRESS' },
  { header: 'ID Card Address', key: 'idCardAddress', width: 38, align: 'left', group: 'ADDRESS' },

  // Employment & Organization
  { header: 'Department', key: 'dept', width: 26, align: 'left', group: 'EMPLOYMENT' },
  { header: 'Division', key: 'div', width: 24, align: 'left', group: 'EMPLOYMENT' },
  { header: 'Position', key: 'pos', width: 26, align: 'left', group: 'EMPLOYMENT' },
  { header: 'Employment Status', key: 'employmentType', width: 18, align: 'center', group: 'EMPLOYMENT' },
  { header: 'Work Location', key: 'workLocation', width: 18, align: 'center', group: 'EMPLOYMENT' },
  { header: 'Shift Schedule', key: 'shiftSchedule', width: 24, align: 'left', group: 'EMPLOYMENT' },
  { header: 'Join Date', key: 'joinDate', width: 16, align: 'center', group: 'EMPLOYMENT' },
  { header: 'Contract End Date', key: 'endDate', width: 18, align: 'center', group: 'EMPLOYMENT' },
  { header: 'Resignation Date', key: 'resignDate', width: 18, align: 'center', group: 'EMPLOYMENT' },
  { header: 'Tenure', key: 'tenure', width: 16, align: 'center', group: 'EMPLOYMENT' },
  { header: 'Status', key: 'status', width: 14, align: 'center', isStatus: true, group: 'EMPLOYMENT' },

  // Payroll & Insurance
  { header: 'Bank Name', key: 'bankName', width: 24, align: 'left', group: 'PAYROLL' },
  { header: 'Bank Account Number', key: 'bankAccount', width: 22, align: 'center', isString: true, group: 'PAYROLL' },
  { header: 'Account Holder Name', key: 'beneficiaryName', width: 26, align: 'left', group: 'PAYROLL' },
  { header: 'BPJS Ketenagakerjaan (KPJ)', key: 'bpjsTk', width: 24, align: 'center', isString: true, group: 'PAYROLL' },
  { header: 'BPJS Kesehatan', key: 'bpjsKesehatan', width: 22, align: 'center', isString: true, group: 'PAYROLL' },

  // Emergency Contact
  { header: 'Emergency Contact Name', key: 'emergencyName', width: 26, align: 'left', group: 'EMERGENCY' },
  { header: 'Relationship', key: 'emergencyRelation', width: 16, align: 'center', group: 'EMERGENCY' },
  { header: 'Emergency Phone Number', key: 'emergencyPhone', width: 20, align: 'center', group: 'EMERGENCY' },
  { header: 'Emergency Contact Address', key: 'emergencyAddress', width: 38, align: 'left', group: 'EMERGENCY' }
];

/**
 * Builds and formats a comprehensive worksheet containing full employee profile data
 */
function populateComprehensiveWorksheet({
  worksheet,
  title,
  subtitle,
  employees,
  getDeptName,
  getDivName,
  resolveResignDate,
  calculateTenure,
  formatShortDate
}) {
  const totalCols = COMPREHENSIVE_COLUMNS.length; // 36

  // 1. Report Title Banner (Row 2)
  worksheet.mergeCells(2, 1, 2, totalCols);
  const titleCell = worksheet.getCell('A2');
  titleCell.value = title;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // 2. Metadata Subtitle (Row 3)
  worksheet.mergeCells(3, 1, 3, totalCols);
  const subCell = worksheet.getCell('A3');
  subCell.value = subtitle;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // 3. Category Group Header (Row 5)
  const groupRow = worksheet.getRow(5);
  groupRow.height = 24;

  const groupRanges = [
    { start: 1, end: 1, label: 'INDEX', bg: 'FF0F172A' },
    { start: 2, end: 14, label: 'PERSONAL INFORMATION & IDENTITY', bg: 'FF1E3A8A' },
    { start: 15, end: 16, label: 'ADDRESS RECORDS', bg: 'FF0284C7' },
    { start: 17, end: 27, label: 'EMPLOYMENT & ORGANIZATION', bg: 'FF1E3A8A' },
    { start: 28, end: 32, label: 'PAYROLL & SOCIAL SECURITY', bg: 'FF0284C7' },
    { start: 33, end: 36, label: 'EMERGENCY CONTACT', bg: 'FF0F172A' }
  ];

  groupRanges.forEach((grp) => {
    worksheet.mergeCells(5, grp.start, 5, grp.end);
    const cell = worksheet.getCell(5, grp.start);
    cell.value = grp.label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: grp.bg }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // 4. Column Header Row (Row 6)
  const headerRow = worksheet.getRow(6);
  headerRow.height = 28;

  COMPREHENSIVE_COLUMNS.forEach((col, idx) => {
    const colIndex = idx + 1;
    const cell = headerRow.getCell(colIndex);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Corporate Navy Blue
    };
    cell.alignment = { vertical: 'middle', horizontal: col.align, wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    worksheet.getColumn(colIndex).width = col.width;
  });

  // Enable Auto Filter on Column Headers (Row 6)
  worksheet.autoFilter = {
    from: { row: 6, column: 1 },
    to: { row: 6, column: totalCols }
  };

  // 5. Populate Data Rows (Row 7+)
  employees.forEach((emp, index) => {
    const isResigned = (emp.status || '').toLowerCase() === 'resigned';
    const resDate = resolveResignDate ? resolveResignDate(emp) : (emp.resignDate || '');
    const tenure = calculateTenure
      ? calculateTenure(emp.joinDate, isResigned ? resDate : null)
      : '—';
    const dept = getDeptName ? getDeptName(emp.departmentId) : '—';
    const div = getDivName ? getDivName(emp.divisionId, emp.departmentId) : '—';

    // Fallbacks consistent with EmployeeDetailView
    const ktpNumber = emp.ktp || emp.nik || '3171015508920001';
    const npwpNumber = emp.npwp || '09.254.678.9-012.000';
    const domicile = emp.domicileAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan';
    const idAddress = emp.idCardAddress || emp.address || 'Jl. Gatot Subroto Kav. 52, No. 12B, Menteng, Jakarta Selatan';
    const bankName = emp.bankName || 'Bank Central Asia (BCA)';
    const bankAccount = emp.bankAccount || '8271-9920-112';
    const beneficiary = emp.beneficiaryName || emp.name;
    const bpjsTk = emp.bpjsTk || '000189283921';
    const bpjsKes = emp.bpjsKesehatan || '000293849182';
    const emgName = emp.emergencyName || 'Dewi Lestari';
    const emgRel = emp.emergencyRelation || 'Spouse';
    const emgPhone = emp.emergencyPhone || '0812-8899-0011';
    const emgAddr = emp.emergencyIdAddress || idAddress;
    const ageVal = calculateAge(emp.dob);

    const rowNum = 7 + index;
    const row = worksheet.getRow(rowNum);
    row.height = 24;

    const isEven = index % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';
    const isActive = (emp.status || 'Active').toLowerCase() === 'active';

    const values = [
      index + 1, // 1. No.
      emp.nik || emp.nip || '—', // 2. Employee NIP
      emp.name || '—', // 3. Full Name
      emp.email || '—', // 4. Email
      emp.phone || '—', // 5. Phone
      emp.gender || 'Male', // 6. Gender
      ktpNumber, // 7. KTP
      npwpNumber, // 8. NPWP
      emp.religion || 'Islam', // 9. Religion
      emp.maritalStatus || 'Married', // 10. Marital Status
      emp.citizenship || 'Indonesia', // 11. Nationality
      emp.birthPlace || 'Jakarta', // 12. Birth Place
      formatShortDate ? formatShortDate(emp.dob) : (emp.dob || '15 May 1994'), // 13. DOB
      ageVal, // 14. Age
      domicile, // 15. Current Address
      idAddress, // 16. ID Card Address
      dept, // 17. Department
      div, // 18. Division
      emp.position || 'Staff', // 19. Position
      emp.employmentType || 'PKWT/KONTRAK', // 20. Employment Status
      emp.workLocation || 'Head Office', // 21. Work Location
      emp.shiftSchedule || 'Normal (08:00 - 17:00)', // 22. Shift
      formatShortDate ? formatShortDate(emp.joinDate) : (emp.joinDate || '—'), // 23. Join Date
      formatShortDate ? formatShortDate(isResigned ? (resDate || emp.endDate) : emp.endDate) : (emp.endDate || '—'), // 24. Contract End Date
      formatShortDate ? formatShortDate(resDate) : (resDate || '—'), // 25. Resign Date
      tenure, // 26. Tenure
      emp.status || (isResigned ? 'Resigned' : 'Active'), // 27. Status
      bankName, // 28. Bank Name
      bankAccount, // 29. Bank Account
      beneficiary, // 30. Account Holder Name
      bpjsTk, // 31. BPJS TK
      bpjsKes, // 32. BPJS Kesehatan
      emgName, // 33. Emergency Name
      emgRel, // 34. Relationship
      emgPhone, // 35. Emergency Phone
      emgAddr // 36. Emergency Address
    ];

    values.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      const spec = COMPREHENSIVE_COLUMNS[colIdx];
      cell.value = val;
      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: Boolean(spec.isBold),
        color: { argb: 'FF0F172A' }
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: spec.align
      };

      // Set explicit string text format for numeric IDs to retain leading zeros
      if (spec.isString) {
        cell.numFmt = '@';
      }

      // Status pill badge styling
      if (spec.isStatus) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isActive ? 'FFDCFCE7' : 'FFFEE2E2' }
        };
        cell.font = {
          name: 'Calibri',
          size: 10,
          bold: true,
          color: { argb: isActive ? 'FF166534' : 'FF991B1B' }
        };
      } else {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBg }
        };
      }

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });
}

/**
 * Exports all employee records to an executive-ready, comprehensive Excel spreadsheet (.xlsx),
 * with full detail data matching the View Profile screen.
 */
export async function exportAllEmployeesToExcel({
  employees,
  getDeptName,
  getDivName,
  resolveResignDate,
  calculateTenure,
  formatShortDate
}) {
  if (!employees || employees.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  workbook.lastModifiedBy = 'PROAPPS System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Freeze headers (top 6 rows) and freeze index + NIP + Name (first 3 columns)
  const worksheet = workbook.addWorksheet('Employee Directory', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 6, showGridLines: true }]
  });

  const exportTimestamp = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  populateComprehensiveWorksheet({
    worksheet,
    title: 'PROAPPS — ALL EMPLOYEE DIRECTORY REPORT',
    subtitle: `Exported on: ${exportTimestamp}   •   Total Records: ${employees.length} employees   •   Full Master Profile (Personal, Address, Employment, Payroll & Emergency Contacts)`,
    employees,
    getDeptName,
    getDivName,
    resolveResignDate,
    calculateTenure,
    formatShortDate
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `employees_full_${todayStr}.xlsx`);
}

/**
 * Exports resigned employee records to an executive-ready, comprehensive Excel spreadsheet (.xlsx),
 * with full detail data matching the View Profile screen and identical theme.
 */
export async function exportResignedEmployeesToExcel({
  employees,
  getDeptName,
  getDivName,
  resolveResignDate,
  calculateTenure,
  formatShortDate
}) {
  if (!employees || employees.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  workbook.lastModifiedBy = 'PROAPPS System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Freeze headers (top 6 rows) and freeze index + NIP + Name (first 3 columns)
  const worksheet = workbook.addWorksheet('Resigned Employees', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 6, showGridLines: true }]
  });

  const exportTimestamp = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  populateComprehensiveWorksheet({
    worksheet,
    title: 'PROAPPS — RESIGNED EMPLOYEE REPORT',
    subtitle: `Exported on: ${exportTimestamp}   •   Total Records: ${employees.length} employees   •   Full Master Profile (Personal, Address, Employment, Payroll & Emergency Contacts)`,
    employees,
    getDeptName,
    getDivName,
    resolveResignDate,
    calculateTenure,
    formatShortDate
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `resigned_employees_full_${todayStr}.xlsx`);
}

/**
 * Template Column Definitions matching the 4-step web manual Add Employee form
 */
export const IMPORT_TEMPLATE_COLUMNS = [
  // Step 1: Personal Data & Identity
  { header: 'Full Name *', key: 'name', width: 26, align: 'left', isBold: true, group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Suryadi Pratama' },
  { header: 'Gender *', key: 'gender', width: 14, align: 'center', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Male' },
  { header: 'NIK (ID Card / KTP) *', key: 'ktp', width: 22, align: 'center', isString: true, group: 'STEP 1: PERSONAL DATA & IDENTITY', example: '3171015508920020' },
  { header: 'Tax Number (NPWP)', key: 'npwp', width: 22, align: 'center', isString: true, group: 'STEP 1: PERSONAL DATA & IDENTITY', example: '09.254.678.9-012.000' },
  { header: 'Nationality', key: 'citizenship', width: 16, align: 'center', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Indonesia' },
  { header: 'Place of Birth', key: 'birthPlace', width: 18, align: 'left', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Jakarta' },
  { header: 'Date of Birth (YYYY-MM-DD)', key: 'dob', width: 20, align: 'center', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: '1992-08-15' },
  { header: 'Religion', key: 'religion', width: 14, align: 'center', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Islam' },
  { header: 'Marital Status', key: 'maritalStatus', width: 16, align: 'center', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Married' },
  { header: 'Work Email *', key: 'email', width: 30, align: 'left', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'suryadi@indoland.co.id' },
  { header: 'Mobile Phone *', key: 'phone', width: 18, align: 'center', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: '0812-3456-7899' },
  { header: 'Current Address (Domicile) *', key: 'domicileAddress', width: 38, align: 'left', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Jl. Gatot Subroto No. 12, Menteng, Jakarta' },
  { header: 'ID Card Address (KTP) *', key: 'idCardAddress', width: 38, align: 'left', group: 'STEP 1: PERSONAL DATA & IDENTITY', example: 'Jl. Gatot Subroto No. 12, Menteng, Jakarta' },

  // Step 2: Employment & Organization
  { header: 'Employee NIP *', key: 'nik', width: 22, align: 'center', isString: true, group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: '3171015508920020' },
  { header: 'Department *', key: 'dept', width: 26, align: 'left', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: 'Engineering' },
  { header: 'Division *', key: 'div', width: 24, align: 'left', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: 'MEP' },
  { header: 'Position / Job Title *', key: 'pos', width: 26, align: 'left', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: 'Staff MEP' },
  { header: 'Employment Status *', key: 'employmentType', width: 20, align: 'center', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: 'PKWT/KONTRAK' },
  { header: 'Work Location', key: 'workLocation', width: 18, align: 'center', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: 'Onsite' },
  { header: 'Shift Schedule', key: 'shiftSchedule', width: 24, align: 'left', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: 'Normal (08:00 - 17:00)' },
  { header: 'Join Date (YYYY-MM-DD) *', key: 'joinDate', width: 22, align: 'center', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: '2024-01-01' },
  { header: 'Contract End Date (YYYY-MM-DD)', key: 'endDate', width: 24, align: 'center', group: 'STEP 2: EMPLOYMENT & ORGANIZATION', example: '2026-01-01' },

  // Step 3: Payroll & Social Security
  { header: 'Bank Name', key: 'bankName', width: 26, align: 'left', group: 'STEP 3: PAYROLL & SOCIAL SECURITY', example: 'Bank Central Asia (BCA)' },
  { header: 'Bank Account Number', key: 'bankAccount', width: 22, align: 'center', isString: true, group: 'STEP 3: PAYROLL & SOCIAL SECURITY', example: '8271-9920-112' },
  { header: 'Account Holder Name', key: 'beneficiaryName', width: 26, align: 'left', group: 'STEP 3: PAYROLL & SOCIAL SECURITY', example: 'Suryadi Pratama' },
  { header: 'BPJS Ketenagakerjaan (KPJ)', key: 'bpjsTk', width: 24, align: 'center', isString: true, group: 'STEP 3: PAYROLL & SOCIAL SECURITY', example: '000189283921' },
  { header: 'BPJS Kesehatan', key: 'bpjsKesehatan', width: 22, align: 'center', isString: true, group: 'STEP 3: PAYROLL & SOCIAL SECURITY', example: '000293849182' },

  // Step 4: Emergency Contact
  { header: 'Emergency Contact Name', key: 'emergencyName', width: 26, align: 'left', group: 'STEP 4: EMERGENCY CONTACT', example: 'Ratna Dewi' },
  { header: 'Relationship', key: 'emergencyRelation', width: 16, align: 'center', group: 'STEP 4: EMERGENCY CONTACT', example: 'Spouse' },
  { header: 'Emergency Phone Number', key: 'emergencyPhone', width: 20, align: 'center', group: 'STEP 4: EMERGENCY CONTACT', example: '0812-8899-0011' },
  { header: 'Emergency Contact Address', key: 'emergencyAddress', width: 38, align: 'left', group: 'STEP 4: EMERGENCY CONTACT', example: 'Jl. Gatot Subroto No. 12, Menteng, Jakarta' }
];

/**
 * Generates and downloads the official Employee Batch Import Template (.xlsx)
 * matching all 4 wizard steps of the manual Add Employee form.
 */
export async function downloadEmployeeImportTemplate({ departments = [], divisions = [], positions = [] } = {}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  workbook.lastModifiedBy = 'PROAPPS System';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ----------------------------------------------------
  // SHEET 1: Employee Import Template
  // ----------------------------------------------------
  const ws = workbook.addWorksheet('Employee Import Template', {
    views: [{ state: 'frozen', xSplit: 1, ySplit: 5, showGridLines: true }]
  });

  const totalCols = IMPORT_TEMPLATE_COLUMNS.length; // 36

  // 1. Title Banner (Row 1)
  ws.mergeCells(1, 1, 1, totalCols);
  const titleCell = ws.getCell('A1');
  titleCell.value = 'PROAPPS — EMPLOYEE BATCH IMPORT TEMPLATE';
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(1).height = 26;

  // 2. Instructions Subtitle (Row 2)
  ws.mergeCells(2, 1, 2, totalCols);
  const subCell = ws.getCell('A2');
  subCell.value = 'Form fields match web manual addition (Step 1 Personal Data, Step 2 Employment, Step 3 Payroll, Step 4 Emergency). Columns with (*) are mandatory. Date format: YYYY-MM-DD.';
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left' };
  ws.getRow(2).height = 20;

  // Row 3 is blank spacer

  // 3. Category Group Headers (Row 4)
  // Step 1: Primary (#002B7F), Step 2: Secondary (#0284C7), Step 3: Primary (#002B7F), Step 4: Secondary (#0284C7)
  const groupRanges = [
    { start: 1, end: 13, label: 'STEP 1: PERSONAL DATA & IDENTITY', bg: 'FF002B7F' },
    { start: 14, end: 22, label: 'STEP 2: EMPLOYMENT & ORGANIZATION', bg: 'FF0284C7' },
    { start: 23, end: 27, label: 'STEP 3: PAYROLL & SOCIAL SECURITY', bg: 'FF002B7F' },
    { start: 28, end: 31, label: 'STEP 4: EMERGENCY CONTACT', bg: 'FF0284C7' }
  ];

  const groupRow = ws.getRow(4);
  groupRow.height = 24;

  groupRanges.forEach((grp) => {
    ws.mergeCells(4, grp.start, 4, grp.end);
    const cell = ws.getCell(4, grp.start);
    cell.value = grp.label;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: grp.bg }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // 4. Column Header Row (Row 5)
  const headerRow = ws.getRow(5);
  headerRow.height = 28;

  const STEP_HEADER_COLORS = {
    'STEP 1: PERSONAL DATA & IDENTITY': 'FF002B7F',
    'STEP 2: EMPLOYMENT & ORGANIZATION': 'FF0284C7',
    'STEP 3: PAYROLL & SOCIAL SECURITY': 'FF002B7F',
    'STEP 4: EMERGENCY CONTACT': 'FF0284C7'
  };

  IMPORT_TEMPLATE_COLUMNS.forEach((col, idx) => {
    const colIndex = idx + 1;
    const cell = headerRow.getCell(colIndex);
    cell.value = col.header;
    cell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: STEP_HEADER_COLORS[col.group] || 'FF002B7F' }
    };
    cell.alignment = { vertical: 'middle', horizontal: col.align, wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };

    ws.getColumn(colIndex).width = col.width;
  });

  // Enable Auto Filter
  ws.autoFilter = {
    from: { row: 5, column: 1 },
    to: { row: 5, column: totalCols }
  };

  // 5. Pre-fill 3 Realistic Sample Rows (Rows 6, 7, 8)
  const sampleRows = [
    [
      'Suryadi Pratama', 'Male', '3171015508920020', '09.254.678.9-012.000', 'Indonesia', 'Jakarta', '1992-08-15', 'Islam', 'Married',
      'suryadi@indoland.co.id', '0812-3456-7899', 'Jl. Gatot Subroto No. 12, Menteng, Jakarta', 'Jl. Gatot Subroto No. 12, Menteng, Jakarta',
      '3171015508920020', 'Engineering', 'MEP', 'Staff MEP', 'PKWT/KONTRAK', 'Onsite', 'Normal (08:00 - 17:00)', '2024-01-01', '2026-01-01',
      'Bank Central Asia (BCA)', '8271-9920-112', 'Suryadi Pratama', '000189283921', '000293849182',
      'Ratna Dewi', 'Spouse', '0812-8899-0011', 'Jl. Gatot Subroto No. 12, Menteng, Jakarta'
    ],
    [
      'Ani Wijaya', 'Female', '3171015508920021', '09.254.678.9-012.001', 'Indonesia', 'Bandung', '1995-03-22', 'Islam', 'Single',
      'ani.w@indoland.co.id', '0813-8877-9911', 'Jl. Sudirman Kav. 45, Jakarta', 'Jl. Sudirman Kav. 45, Jakarta',
      '3171015508920021', 'Building Service', 'Security', 'Komandan Regu (Danru) Security', 'PKWT/KONTRAK', 'Onsite', 'Shift A (07:00 - 15:00)', '2024-02-01', '2026-02-01',
      'Bank Mandiri', '1230-0987-654', 'Ani Wijaya', '000189283922', '000293849183',
      'Bambang Wijaya', 'Parent', '0813-9988-7766', 'Jl. Sudirman Kav. 45, Jakarta'
    ],
    [
      'Hendra Kusuma', 'Male', '3171015508920022', '09.254.678.9-012.002', 'Indonesia', 'Surabaya', '1990-11-10', 'Kristen', 'Married',
      'hendra.k@indoland.co.id', '0815-1122-3344', 'Jl. Rasuna Said Blok B3, Jakarta', 'Jl. Rasuna Said Blok B3, Jakarta',
      '3171015508920022', 'Building Management', 'General Operation', 'Building Manager', 'PKWT/PERMANEN', 'Head Office', 'Normal (08:00 - 17:00)', '2023-05-01', '2026-05-01',
      'Bank Central Asia (BCA)', '7721-3344-556', 'Hendra Kusuma', '000189283923', '000293849184',
      'Maria Kusuma', 'Spouse', '0815-7788-9900', 'Jl. Rasuna Said Blok B3, Jakarta'
    ]
  ];

  sampleRows.forEach((rowVals, rIdx) => {
    const rowNum = 6 + rIdx;
    const row = ws.getRow(rowNum);
    row.height = 24;
    const isEven = rIdx % 2 === 0;

    rowVals.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const spec = IMPORT_TEMPLATE_COLUMNS[cIdx];
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, bold: Boolean(spec.isBold), color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: spec.align };
      if (spec.isString) cell.numFmt = '@';
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // 6. Define Native Excel Dropdown Lists (Data Validations) matching web form selects
  const deptOptions = departments && departments.length > 0
    ? departments.map((d) => d.name || d.code)
    : ['Building Management', 'Engineering', 'Building Service', 'Tenant Relation', 'Finance & Accounting'];

  const divOptions = divisions && divisions.length > 0
    ? divisions.map((d) => d.name || d.code)
    : ['General Operation', 'MEP', 'Security', 'House Keeping', 'Tenant Relation', 'Finance'];

  const posOptions = positions && positions.length > 0
    ? Array.from(new Set(positions.map((p) => p.name).filter(Boolean)))
    : [
        'Building Manager',
        'Assistant Building Manager (ABM)',
        'Chief',
        'Supervisor',
        'Coordinator',
        'Team Leader',
        'Danru',
        'Admin',
        'Staff'
      ];

  // Helper to ensure formula does not exceed Excel list validation length limit (255 characters)
  const toFormulaList = (options) => {
    let list = [...options];
    while (list.join(',').length > 240 && list.length > 1) {
      list.pop();
    }
    return `"${list.join(',')}"`;
  };

  const DROPDOWN_VALIDATIONS = {
    gender: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Male,Female"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Pilihan Gender',
      error: 'Silakan pilih Male atau Female dari dropdown.'
    },
    religion: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Islam,Kristen,Katolik,Hindu,Buddha,Konghucu,Other"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Pilihan Agama',
      error: 'Silakan pilih agama dari pilihan dropdown.'
    },
    maritalStatus: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Single,Married,Widowed,Divorced"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Status Pernikahan',
      error: 'Silakan pilih status pernikahan dari dropdown.'
    },
    dept: {
      type: 'list',
      allowBlank: true,
      formulae: [toFormulaList(deptOptions)],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Pilihan Departemen',
      error: 'Silakan pilih departemen dari pilihan dropdown.'
    },
    div: {
      type: 'list',
      allowBlank: true,
      formulae: [toFormulaList(divOptions)],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Pilihan Divisi',
      error: 'Silakan pilih divisi dari pilihan dropdown.'
    },
    pos: {
      type: 'list',
      allowBlank: true,
      formulae: [toFormulaList(posOptions)],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Pilihan Posisi / Jabatan',
      error: 'Silakan pilih posisi/jabatan dari pilihan dropdown.'
    },
    employmentType: {
      type: 'list',
      allowBlank: true,
      formulae: ['"PKWT/KONTRAK,PKWT/PERMANEN,Vendor,Magang,Freelance"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Status Karyawan',
      error: 'Silakan pilih status kepegawaian dari pilihan dropdown.'
    },
    workLocation: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Onsite,Head Office,Hybrid"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Lokasi Kerja',
      error: 'Silakan pilih lokasi kerja dari pilihan dropdown.'
    },
    shiftSchedule: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Normal (08:00 - 17:00),Shift A (07:00 - 15:00),Shift B (15:00 - 23:00),Shift C (23:00 - 07:00)"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Jadwal Shift',
      error: 'Silakan pilih jadwal shift dari pilihan dropdown.'
    },
    status: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Active,Resigned"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Status Keaktifan',
      error: 'Silakan pilih Active atau Resigned dari dropdown.'
    },
    bankName: {
      type: 'list',
      allowBlank: true,
      formulae: [
        '"Bank Central Asia (BCA),Bank Mandiri,Bank Rakyat Indonesia (BRI),Bank Negara Indonesia (BNI),Bank Syariah Indonesia (BSI),Bank CIMB Niaga,Bank Permata,Bank Danamon,Bank Mega,Bank Panin,Bank OCBC NISP,Other"'
      ],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Pilihan Bank',
      error: 'Silakan pilih bank pembayaran dari pilihan dropdown.'
    },
    emergencyRelation: {
      type: 'list',
      allowBlank: true,
      formulae: ['"Spouse,Parent,Sibling,Child,Relative,Friend,Other"'],
      showErrorMessage: true,
      errorStyle: 'warning',
      errorTitle: 'Hubungan Kontak Darurat',
      error: 'Silakan pilih hubungan kontak darurat dari dropdown.'
    }
  };

  // Apply dropdown data validations and executive styling across input rows (rows 6 to 100)
  const TOTAL_TEMPLATE_INPUT_ROWS = 100;
  for (let r = 6; r <= TOTAL_TEMPLATE_INPUT_ROWS; r++) {
    const row = ws.getRow(r);
    if (r > 8) {
      row.height = 22;
    }
    const isEven = r % 2 === 0;

    IMPORT_TEMPLATE_COLUMNS.forEach((spec, cIdx) => {
      const colIdx = cIdx + 1;
      const cell = row.getCell(colIdx);

      // Attach native Excel dropdown validation if column is a choice field
      if (DROPDOWN_VALIDATIONS[spec.key]) {
        cell.dataValidation = DROPDOWN_VALIDATIONS[spec.key];
      }

      // Format empty rows (rows 9..100) so users can immediately type with clean styles and correct string formats
      if (r > 8) {
        cell.font = { name: 'Calibri', size: 10, color: { argb: 'FF0F172A' } };
        cell.alignment = { vertical: 'middle', horizontal: spec.align };
        if (spec.isString) cell.numFmt = '@';
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
        };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    });
  }

  // ----------------------------------------------------
  // SHEET 2: Reference & Options Guide
  // ----------------------------------------------------
  const refWs = workbook.addWorksheet('Reference & Options Guide', {
    views: [{ showGridLines: true }]
  });

  refWs.mergeCells('A1:D1');
  refWs.getCell('A1').value = 'PROAPPS — FORM OPTIONS & VALIDATION REFERENCE';
  refWs.getCell('A1').font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF1E3A8A' } };
  refWs.getRow(1).height = 24;

  const refHeaders = ['Field Name', 'Available Standard Options', 'Input Rule', 'Example Value'];
  const refHeaderRow = refWs.getRow(3);
  refHeaderRow.height = 26;
  refHeaders.forEach((h, i) => {
    const c = refHeaderRow.getCell(i + 1);
    c.value = h;
    c.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFFFFFFF' } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    c.alignment = { vertical: 'middle', horizontal: 'left' };
    c.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  const refData = [
    ['Gender', 'Male, Female', 'Dropdown List (Mandatory)', 'Male'],
    ['Religion', 'Islam, Kristen, Katolik, Hindu, Buddha, Konghucu, Other', 'Dropdown List (Mandatory)', 'Islam'],
    ['Marital Status', 'Single, Married, Widowed, Divorced', 'Dropdown List (Mandatory)', 'Married'],
    ['Department', deptOptions.join(', '), 'Dropdown List (Mandatory)', deptOptions[0] || 'Engineering'],
    ['Division', divOptions.join(', '), 'Dropdown List (Mandatory)', divOptions[0] || 'MEP'],
    ['Position / Job Title', posOptions.slice(0, 10).join(', '), 'Dropdown List (Mandatory)', posOptions[0] || 'Staff MEP'],
    ['Employment Status', 'PKWT/KONTRAK, PKWT/PERMANEN, Vendor, Magang, Freelance', 'Dropdown List (Mandatory)', 'PKWT/KONTRAK'],
    ['Work Location', 'Onsite, Head Office, Hybrid', 'Dropdown List', 'Onsite'],
    ['Shift Schedule', 'Normal (08:00 - 17:00), Shift A, Shift B, Shift C', 'Dropdown List', 'Normal (08:00 - 17:00)'],
    ['Bank Name', 'Bank Central Asia (BCA), Bank Mandiri, BRI, BNI, BSI, CIMB Niaga, Permata, Other', 'Dropdown List', 'Bank Central Asia (BCA)'],
    ['Relationship (Emergency)', 'Spouse, Parent, Sibling, Child, Relative, Friend, Other', 'Dropdown List (Mandatory)', 'Spouse'],
    ['Date Fields', 'Join Date, Date of Birth, Contract End Date', 'Format YYYY-MM-DD required', '2024-01-15']
  ];

  refWs.getColumn(1).width = 28;
  refWs.getColumn(2).width = 46;
  refWs.getColumn(3).width = 32;
  refWs.getColumn(4).width = 28;

  refData.forEach((rowVals, idx) => {
    const row = refWs.getRow(4 + idx);
    row.height = 22;
    rowVals.forEach((val, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      cell.value = val;
      cell.font = { name: 'Calibri', size: 10, bold: cIdx === 0, color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  return await downloadWorkbook(workbook, 'Employee_Import_Template.xlsx');
}

/**
 * Universal Parser for Employee Batch Import files (supports .xlsx, .xls, and .csv)
 * Maps all 4-step wizard fields into a standardized employee record array.
 */
export async function parseEmployeeImportFile(file, departments = [], divisions = []) {
  if (!file) throw new Error('No file selected.');

  const fileName = file.name || '';
  const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');

  // Helper to map department text to ID
  const resolveDeptId = (deptText) => {
    if (!deptText) return 'dept-bm';
    const clean = String(deptText).trim().toLowerCase();
    const matched = departments.find(
      (d) => d.id === clean || d.code?.toLowerCase() === clean || d.name?.toLowerCase().includes(clean)
    );
    if (matched) return matched.id;
    if (clean.includes('eng')) return 'dept-eng';
    if (clean.includes('bs') || clean.includes('sec') || clean.includes('service') || clean.includes('hk')) return 'dept-bs';
    if (clean.includes('tr') || clean.includes('tenant')) return 'dept-tr';
    if (clean.includes('fin')) return 'dept-fin';
    return 'dept-bm';
  };

  // Helper to map division text to ID
  const resolveDivId = (divText, deptId) => {
    if (!divText) return 'div-bm';
    const clean = String(divText).trim().toLowerCase();
    const matched = divisions.find(
      (d) => d.id === clean || d.code?.toLowerCase() === clean || d.name?.toLowerCase().includes(clean)
    );
    if (matched) return matched.id;
    if (clean.includes('sec') || clean.includes('satpam')) return 'div-sec';
    if (clean.includes('eng') || clean.includes('mep') || clean.includes('teknik')) return 'div-eng';
    if (clean.includes('hk') || clean.includes('house') || clean.includes('clean')) return 'div-hk';
    if (clean.includes('tr') || clean.includes('tenant')) return 'div-tr';
    if (clean.includes('fin')) return 'div-fin';
    return 'div-bm';
  };

  const parsedRecords = [];

  if (isExcel) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) {
      throw new Error('Workbook contains no readable worksheets.');
    }

    // Find the header row (typically row 5 in our template, or first row containing 'Full Name' / 'NIP')
    let headerRowIdx = 5;
    let foundHeader = false;

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (foundHeader) return;
      const rowValues = Array.isArray(row.values) ? row.values.map((v) => String(v || '').toLowerCase()) : [];
      if (rowValues.some((v) => v.includes('nip') || v.includes('full name') || v.includes('nama'))) {
        headerRowIdx = rowNumber;
        foundHeader = true;
      }
    });

    // Build intelligent column map based on actual column headers
    const colMap = {};
    const headerRow = worksheet.getRow(headerRowIdx);
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const h = String(cell.value || '').toLowerCase().trim();
      if (h.includes('full name') || h === 'name' || h.includes('nama lengkap')) colMap.name = colNumber;
      else if (h.includes('gender') || h.includes('jenis kelamin')) colMap.gender = colNumber;
      else if (h.includes('ktp') && !h.includes('address') && !h.includes('alamat') && !h.includes('doc')) colMap.ktp = colNumber;
      else if ((h.includes('tax') || h.includes('npwp')) && !h.includes('doc')) colMap.npwp = colNumber;
      else if (h.includes('nationality') || h.includes('citizenship') || h.includes('kewarganegaraan')) colMap.citizenship = colNumber;
      else if (h.includes('birth place') || h.includes('place of birth') || h.includes('tempat lahir')) colMap.birthPlace = colNumber;
      else if (h.includes('dob') || h.includes('date of birth') || h.includes('tanggal lahir')) colMap.dob = colNumber;
      else if (h.includes('religion') || h.includes('agama')) colMap.religion = colNumber;
      else if (h.includes('marital') || h.includes('status nikah')) colMap.maritalStatus = colNumber;
      else if (h.includes('email')) colMap.email = colNumber;
      else if ((h.includes('mobile phone') || h.includes('telepon')) && !h.includes('emergency')) colMap.phone = colNumber;
      else if (h.includes('domicile') || h.includes('current address') || h.includes('domisili')) colMap.domicileAddress = colNumber;
      else if ((h.includes('id card address') || h.includes('alamat ktp')) && !h.includes('emergency')) colMap.idCardAddress = colNumber;
      // Document Attachments (Step 1)
      else if (h.includes('doc') && (h.includes('ktp') || h.includes('id card'))) colMap.docKtp = colNumber;
      else if (h.includes('doc') && (h.includes('npwp') || h.includes('tax'))) colMap.docNpwp = colNumber;
      else if (h.includes('doc') && (h.includes('kk') || h.includes('family'))) colMap.docKk = colNumber;
      else if (h.includes('doc') && (h.includes('contract') || h.includes('other') || h.includes('certificate'))) colMap.docOther = colNumber;
      // Step 2: Employment
      else if (h.includes('nip') || h.includes('employee nip')) colMap.nik = colNumber;
      else if (h.includes('dept') || h.includes('department')) colMap.dept = colNumber;
      else if (h.includes('div') || h.includes('division')) colMap.div = colNumber;
      else if (h.includes('pos') || h.includes('position') || h.includes('job title')) colMap.pos = colNumber;
      else if (h.includes('employment status') || h.includes('employee status')) colMap.employmentType = colNumber;
      else if (h.includes('work location') || h.includes('lokasi kerja')) colMap.workLocation = colNumber;
      else if (h.includes('shift') || h.includes('schedule')) colMap.shiftSchedule = colNumber;
      else if (h.includes('join date') || h.includes('tanggal masuk')) colMap.joinDate = colNumber;
      else if (h.includes('contract end') || h.includes('end date')) colMap.endDate = colNumber;
      else if (h.includes('status') && !h.includes('marital') && !h.includes('employment')) colMap.status = colNumber;
      // Step 3: Payroll
      else if (h.includes('bank name') || h.includes('nama bank')) colMap.bankName = colNumber;
      else if (h.includes('bank account') || h.includes('nomor rekening')) colMap.bankAccount = colNumber;
      else if (h.includes('holder') || h.includes('beneficiary')) colMap.beneficiaryName = colNumber;
      else if (h.includes('bpjs ketenagakerjaan') || h.includes('kpj')) colMap.bpjsTk = colNumber;
      else if (h.includes('bpjs kesehatan')) colMap.bpjsKesehatan = colNumber;
      // Step 4: Emergency Contact
      else if (h.includes('emergency contact name') || h.includes('emergency name')) colMap.emergencyName = colNumber;
      else if (h.includes('relationship') || h.includes('hubungan')) colMap.emergencyRelation = colNumber;
      else if (h.includes('emergency phone')) colMap.emergencyPhone = colNumber;
      else if (h.includes('emergency contact address') || h.includes('emergency address')) colMap.emergencyAddress = colNumber;
    });

    const hasNewDocCols = Boolean(colMap.docKtp || colMap.docNpwp || colMap.docKk || colMap.docOther);

    // Read subsequent data rows
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber <= headerRowIdx) return; // Skip headers & banners

      // In ExcelJS, row.values is 1-indexed (index 0 is empty)
      const getVal = (colIdx) => {
        if (!colIdx) return '';
        const val = row.getCell(colIdx).value;
        if (val === null || val === undefined) return '';
        if (typeof val === 'object' && val.text) return String(val.text).trim();
        if (typeof val === 'object' && val instanceof Date) return val.toISOString().slice(0, 10);
        return String(val).trim();
      };

      const name = getVal(colMap.name || 1);
      const gender = getVal(colMap.gender || 2) || 'Male';
      const ktp = getVal(colMap.ktp || 3);
      const npwp = getVal(colMap.npwp || 4);
      const citizenship = getVal(colMap.citizenship || 5) || 'Indonesia';
      const birthPlace = getVal(colMap.birthPlace || 6) || 'Jakarta';
      const dob = getVal(colMap.dob || 7);
      const religion = getVal(colMap.religion || 8) || 'Islam';
      const maritalStatus = getVal(colMap.maritalStatus || 9) || 'Married';
      const email = getVal(colMap.email || 10);
      const phone = getVal(colMap.phone || 11);
      const domicileAddress = getVal(colMap.domicileAddress || 12);
      const idCardAddress = getVal(colMap.idCardAddress || 13) || domicileAddress;

      // Document Attachments
      const docKtp = getVal(colMap.docKtp || (hasNewDocCols ? 14 : 0));
      const docNpwp = getVal(colMap.docNpwp || (hasNewDocCols ? 15 : 0));
      const docKk = getVal(colMap.docKk || (hasNewDocCols ? 16 : 0));
      const docOther = getVal(colMap.docOther || (hasNewDocCols ? 17 : 0));

      const offset = hasNewDocCols ? 4 : 0;
      const nik = getVal(colMap.nik || (14 + offset)) || ktp;
      const deptText = getVal(colMap.dept || (15 + offset));
      const divText = getVal(colMap.div || (16 + offset));
      const position = getVal(colMap.pos || (17 + offset)) || 'Staff';
      const employmentType = getVal(colMap.employmentType || (18 + offset)) || 'PKWT/KONTRAK';
      const workLocation = getVal(colMap.workLocation || (19 + offset)) || 'Head Office';
      const shiftSchedule = getVal(colMap.shiftSchedule || (20 + offset)) || 'Normal (08:00 - 17:00)';
      const joinDate = getVal(colMap.joinDate || (21 + offset)) || new Date().toISOString().slice(0, 10);
      const endDate = getVal(colMap.endDate || (22 + offset));
      const status = getVal(colMap.status || (23 + offset)) || 'Active';

      const bankName = getVal(colMap.bankName || (24 + offset)) || 'Bank Central Asia (BCA)';
      const bankAccount = getVal(colMap.bankAccount || (25 + offset));
      const beneficiaryName = getVal(colMap.beneficiaryName || (26 + offset)) || name;
      const bpjsTk = getVal(colMap.bpjsTk || (27 + offset));
      const bpjsKesehatan = getVal(colMap.bpjsKesehatan || (28 + offset));

      const emergencyName = getVal(colMap.emergencyName || (29 + offset));
      const emergencyRelation = getVal(colMap.emergencyRelation || (30 + offset)) || 'Spouse';
      const emergencyPhone = getVal(colMap.emergencyPhone || (31 + offset));
      const emergencyIdAddress = getVal(colMap.emergencyAddress || (32 + offset)) || domicileAddress;

      // Only add row if it has minimum essential identifier (Name or NIP)
      if (name || nik) {
        const departmentId = resolveDeptId(deptText);
        const divisionId = resolveDivId(divText, departmentId);

        // Build structured document attachments matching AddEmployeeView Step 1
        const documents = [];
        if (docKtp) {
          documents.push({
            id: `doc-${Date.now()}-ktp-${parsedRecords.length + 1}`,
            category: 'ID Card (KTP)',
            categoryLabel: 'ID Card (KTP)',
            name: docKtp,
            size: 1024 * 1250,
            isPdf: docKtp.toLowerCase().endsWith('.pdf'),
            type: docKtp.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            uploadedAt: new Date().toISOString()
          });
        }
        if (docNpwp) {
          documents.push({
            id: `doc-${Date.now()}-npwp-${parsedRecords.length + 1}`,
            category: 'NPWP Card',
            categoryLabel: 'Tax Card (NPWP)',
            name: docNpwp,
            size: 1024 * 850,
            isPdf: docNpwp.toLowerCase().endsWith('.pdf'),
            type: docNpwp.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png',
            uploadedAt: new Date().toISOString()
          });
        }
        if (docKk) {
          documents.push({
            id: `doc-${Date.now()}-kk-${parsedRecords.length + 1}`,
            category: 'Family Card (KK)',
            categoryLabel: 'Family Card (KK)',
            name: docKk,
            size: 1024 * 1450,
            isPdf: docKk.toLowerCase().endsWith('.pdf'),
            type: docKk.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            uploadedAt: new Date().toISOString()
          });
        }
        if (docOther) {
          documents.push({
            id: `doc-${Date.now()}-other-${parsedRecords.length + 1}`,
            category: 'Work Contract',
            categoryLabel: 'Work Contract',
            name: docOther,
            size: 1024 * 1100,
            isPdf: docOther.toLowerCase().endsWith('.pdf'),
            type: docOther.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            uploadedAt: new Date().toISOString()
          });
        }

        parsedRecords.push({
          name: name || `Employee ${parsedRecords.length + 1}`,
          gender,
          ktp: ktp || nik,
          npwp,
          citizenship,
          birthPlace,
          dob,
          religion,
          maritalStatus,
          email: email || `${(nik || name).toLowerCase().replace(/\s+/g, '.')}@indoland.co.id`,
          phone,
          domicileAddress,
          idCardAddress,
          documents,
          nik: nik || `NIP-${Date.now()}-${parsedRecords.length + 1}`,
          departmentId,
          divisionId,
          position,
          employmentType,
          workLocation,
          shiftSchedule,
          joinDate,
          endDate,
          status: status.toLowerCase().includes('resign') ? 'Resigned' : 'Active',
          bankName,
          bankAccount,
          beneficiaryName,
          bpjsTk,
          bpjsKesehatan,
          emergencyName,
          emergencyRelation,
          emergencyPhone,
          emergencyIdAddress
        });
      }
    });
  } else {
    // CSV Fallback Parser
    const text = await file.text();
    const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      throw new Error('CSV file is empty or only contains headers.');
    }

    // Determine if legacy simple format or comprehensive format
    const headerLine = lines[0].toLowerCase();
    const isLegacy = !headerLine.includes('gender') && headerLine.split(',').length < 15;
    const hasDocCols = headerLine.includes('doc') || headerLine.includes('document');

    lines.slice(1).forEach((line, idx) => {
      const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
      if (cols.length < 2) return;

      if (isLegacy) {
        const nip = cols[0];
        const name = cols[1] || `Employee ${idx + 1}`;
        const email = cols[2] || `${nip.toLowerCase()}@indoland.co.id`;
        const phone = cols[3] || '';
        const deptId = resolveDeptId(cols[4]);
        const divId = resolveDivId(cols[5], deptId);
        const pos = cols[6] || 'Staff';
        const join = cols[7] || new Date().toISOString().slice(0, 10);
        const end = cols[8] || '';
        const status = cols[9] || 'Active';

        parsedRecords.push({
          nik: nip,
          name,
          email,
          phone,
          departmentId: deptId,
          divisionId: divId,
          position: pos,
          joinDate: join,
          endDate: end,
          status: status.toLowerCase().includes('resign') ? 'Resigned' : 'Active',
          gender: 'Male',
          citizenship: 'Indonesia',
          employmentType: 'PKWT/KONTRAK',
          workLocation: 'Head Office',
          shiftSchedule: 'Normal (08:00 - 17:00)',
          documents: []
        });
      } else {
        const name = cols[0];
        const gender = cols[1] || 'Male';
        const ktp = cols[2];
        const npwp = cols[3];
        const citizenship = cols[4] || 'Indonesia';
        const birthPlace = cols[5] || 'Jakarta';
        const dob = cols[6];
        const religion = cols[7] || 'Islam';
        const maritalStatus = cols[8] || 'Married';
        const email = cols[9];
        const phone = cols[10];
        const domicileAddress = cols[11];
        const idCardAddress = cols[12] || domicileAddress;

        let docKtp = '';
        let docNpwp = '';
        let docKk = '';
        let docOther = '';
        let offset = 0;

        if (hasDocCols) {
          docKtp = cols[13] || '';
          docNpwp = cols[14] || '';
          docKk = cols[15] || '';
          docOther = cols[16] || '';
          offset = 4;
        }

        const nik = cols[13 + offset] || ktp;
        const deptId = resolveDeptId(cols[14 + offset]);
        const divId = resolveDivId(cols[15 + offset], deptId);
        const position = cols[16 + offset] || 'Staff';
        const employmentType = cols[17 + offset] || 'PKWT/KONTRAK';
        const workLocation = cols[18 + offset] || 'Head Office';
        const shiftSchedule = cols[19 + offset] || 'Normal (08:00 - 17:00)';
        const joinDate = cols[20 + offset] || new Date().toISOString().slice(0, 10);
        const endDate = cols[21 + offset];
        const status = cols[22 + offset] || 'Active';

        const bankName = cols[23 + offset] || 'Bank Central Asia (BCA)';
        const bankAccount = cols[24 + offset];
        const beneficiaryName = cols[25 + offset] || name;
        const bpjsTk = cols[26 + offset];
        const bpjsKesehatan = cols[27 + offset];

        const emergencyName = cols[28 + offset];
        const emergencyRelation = cols[29 + offset] || 'Spouse';
        const emergencyPhone = cols[30 + offset];
        const emergencyIdAddress = cols[31 + offset] || domicileAddress;

        if (name || nik) {
          const documents = [];
          if (docKtp) {
            documents.push({
              id: `doc-${Date.now()}-ktp-${parsedRecords.length + 1}`,
              category: 'ID Card (KTP)',
              categoryLabel: 'ID Card (KTP)',
              name: docKtp,
              size: 1024 * 1250,
              isPdf: docKtp.toLowerCase().endsWith('.pdf')
            });
          }
          if (docNpwp) {
            documents.push({
              id: `doc-${Date.now()}-npwp-${parsedRecords.length + 1}`,
              category: 'NPWP Card',
              categoryLabel: 'Tax Card (NPWP)',
              name: docNpwp,
              size: 1024 * 850,
              isPdf: docNpwp.toLowerCase().endsWith('.pdf')
            });
          }
          if (docKk) {
            documents.push({
              id: `doc-${Date.now()}-kk-${parsedRecords.length + 1}`,
              category: 'Family Card (KK)',
              categoryLabel: 'Family Card (KK)',
              name: docKk,
              size: 1024 * 1450,
              isPdf: docKk.toLowerCase().endsWith('.pdf')
            });
          }
          if (docOther) {
            documents.push({
              id: `doc-${Date.now()}-other-${parsedRecords.length + 1}`,
              category: 'Work Contract',
              categoryLabel: 'Work Contract',
              name: docOther,
              size: 1024 * 1100,
              isPdf: docOther.toLowerCase().endsWith('.pdf')
            });
          }

          parsedRecords.push({
            name: name || `Employee ${parsedRecords.length + 1}`,
            gender,
            ktp: ktp || nik,
            npwp,
            citizenship,
            birthPlace,
            dob,
            religion,
            maritalStatus,
            email: email || `${(nik || name).toLowerCase().replace(/\s+/g, '.')}@indoland.co.id`,
            phone,
            domicileAddress,
            idCardAddress,
            documents,
            nik: nik || `NIP-${Date.now()}-${parsedRecords.length + 1}`,
            departmentId: deptId,
            divisionId: divId,
            position,
            employmentType,
            workLocation,
            shiftSchedule,
            joinDate,
            endDate,
            status: status.toLowerCase().includes('resign') ? 'Resigned' : 'Active',
            bankName,
            bankAccount,
            beneficiaryName,
            bpjsTk,
            bpjsKesehatan,
            emergencyName,
            emergencyRelation,
            emergencyPhone,
            emergencyIdAddress
          });
        }
      }
    });
  }

  if (parsedRecords.length === 0) {
    throw new Error('No valid employee records found in the uploaded file.');
  }

  return parsedRecords;
}

/**
 * Exports the holiday and collective leave calendar to a single-sheet Excel file (.xlsx).
 * Rows are written in the order given, so callers decide filtering and sorting.
 */
export async function exportHolidaysToExcel({ holidays, treatmentOptions = [], departments = [] }) {
  if (!holidays || holidays.length === 0) return;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PROAPPS';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Holiday Calendar', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  worksheet.columns = [
    { header: 'No.', key: 'no', width: 6 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Day', key: 'day', width: 14 },
    { header: 'Holiday Name', key: 'name', width: 38 },
    { header: 'Type', key: 'type', width: 18 },
    { header: 'Leave Treatment', key: 'treatment', width: 38 },
    { header: 'Departments', key: 'departments', width: 44 },
    { header: 'Note', key: 'note', width: 44 }
  ];

  holidays.forEach((holiday, index) => {
    const treatment = treatmentOptions.find((option) => option.value === holiday.treatment);
    worksheet.addRow({
      no: index + 1,
      date: holiday.date,
      day: new Date(`${holiday.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' }),
      name: holiday.name,
      type: holiday.isCutiBersama ? 'Collective Leave' : 'National Holiday',
      treatment: holiday.isCutiBersama
        ? (treatment?.badge || holiday.treatment || '')
        : 'Official Holiday (No Leave Deduction)',
      departments: holiday.isCutiBersama && holiday.scope === 'departments'
        ? (holiday.scopeValue || []).map((id) => departments.find((d) => d.id === id)?.name || id).join(', ')
        : 'All departments',
      note: holiday.note || ''
    });
  });

  const header = worksheet.getRow(1);
  header.height = 22;
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF002B7F' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });
  worksheet.getColumn('no').alignment = { horizontal: 'center' };

  const todayStr = new Date().toISOString().slice(0, 10);
  await downloadWorkbook(workbook, `holidays_${todayStr}.xlsx`);
}
