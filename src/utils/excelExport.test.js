import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  exportResignedEmployeesToExcel,
  exportAllEmployeesToExcel,
  downloadEmployeeImportTemplate,
  parseEmployeeImportFile
} from './excelExport';

describe('excelExport utility test suite', () => {
  it('generates a valid ExcelJS buffer for resigned employees in Node/SSR environment', async () => {
    const dummyEmployees = [
      {
        id: 'emp-001',
        nik: '3174052109840006',
        name: 'Robert Gunawan',
        email: 'robert.g@indoland.co.id',
        phone: '0811-1234-5678',
        departmentId: 'dept-fin',
        divisionId: 'div-fin',
        position: 'Staff Finance',
        joinDate: '2023-08-01',
        endDate: '2024-07-31',
        status: 'Resigned'
      }
    ];

    // In node/SSR without window, it executes and returns the Excel binary buffer
    await expect(
      exportResignedEmployeesToExcel({
        employees: dummyEmployees,
        getDeptName: () => 'Finance & Accounting',
        getDivName: () => 'Finance',
        resolveResignDate: () => '2024-07-31',
        calculateTenure: () => '11 months',
        formatShortDate: (d) => d
      })
    ).resolves.not.toThrow();
  });

  it('generates a valid ExcelJS buffer for all employees in Node/SSR environment', async () => {
    const dummyEmployees = [
      {
        id: 'emp-002',
        nik: '3174052109840007',
        name: 'Budi Santoso',
        email: 'budi.s@indoland.co.id',
        phone: '0812-3456-7890',
        departmentId: 'dept-bm',
        divisionId: 'div-bm',
        position: 'Supervisor',
        joinDate: '2022-01-01',
        endDate: '2025-01-01',
        status: 'Active'
      }
    ];

    await expect(
      exportAllEmployeesToExcel({
        employees: dummyEmployees,
        getDeptName: () => 'Building Management',
        getDivName: () => 'Operation',
        resolveResignDate: () => null,
        calculateTenure: () => '2 years',
        formatShortDate: (d) => d
      })
    ).resolves.not.toThrow();
  });

  it('gracefully handles empty employee list without error', async () => {
    await expect(exportResignedEmployeesToExcel({ employees: [] })).resolves.toBeUndefined();
    await expect(exportAllEmployeesToExcel({ employees: [] })).resolves.toBeUndefined();
  });

  it('generates the official 4-step Employee Import Template (.xlsx) with sample data, reference guide, and native dropdown validations', async () => {
    const buffer = await downloadEmployeeImportTemplate({
      departments: [{ id: 'dept-eng', name: 'Engineering' }],
      divisions: [{ id: 'div-eng', name: 'MEP' }],
      positions: [{ id: 'pos-1', name: 'Staff' }]
    });

    expect(buffer).toBeDefined();

    // Verify data validations are properly encoded in the ExcelJS workbook
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);

    const ws = wb.getWorksheet('Employee Import Template');
    expect(ws).toBeDefined();

    // Row 6 (Sample 1) validations
    const genderVal = ws.getCell('B6').dataValidation;
    expect(genderVal).toBeDefined();
    expect(genderVal.type).toBe('list');
    expect(genderVal.formulae[0]).toContain('Male,Female');

    const religionVal = ws.getCell('H6').dataValidation;
    expect(religionVal.formulae[0]).toContain('Islam');

    const maritalVal = ws.getCell('I6').dataValidation;
    expect(maritalVal.formulae[0]).toContain('Single,Married');

    const deptVal = ws.getCell('O6').dataValidation;
    expect(deptVal.formulae[0]).toContain('Engineering');

    const divVal = ws.getCell('P6').dataValidation;
    expect(divVal.formulae[0]).toContain('MEP');

    const posVal = ws.getCell('Q6').dataValidation;
    expect(posVal.formulae[0]).toContain('Staff');

    const empTypeVal = ws.getCell('R6').dataValidation;
    expect(empTypeVal.formulae[0]).toContain('PKWT/KONTRAK');

    const bankVal = ws.getCell('W6').dataValidation;
    expect(bankVal.formulae[0]).toContain('Bank Central Asia (BCA)');

    const emgRelVal = ws.getCell('AC6').dataValidation;
    expect(emgRelVal.formulae[0]).toContain('Spouse');

    // Blank input row (Row 50) also has dropdown attached for easy user entry
    const row50GenderVal = ws.getCell('B50').dataValidation;
    expect(row50GenderVal).toBeDefined();
    expect(row50GenderVal.type).toBe('list');

    // Verify Row 4 Category Group Colors (Step 1 Primary, Step 2 Secondary, Step 3 Primary, Step 4 Secondary)
    expect(ws.getCell(4, 1).fill.fgColor.argb).toBe('FF002B7F');
    expect(ws.getCell(4, 14).fill.fgColor.argb).toBe('FF0284C7');
    expect(ws.getCell(4, 23).fill.fgColor.argb).toBe('FF002B7F');
    expect(ws.getCell(4, 28).fill.fgColor.argb).toBe('FF0284C7');

    // Verify Row 5 Column Header Colors matching steps
    expect(ws.getCell(5, 1).fill.fgColor.argb).toBe('FF002B7F'); // Step 1
    expect(ws.getCell(5, 14).fill.fgColor.argb).toBe('FF0284C7'); // Step 2 (Secondary)
    expect(ws.getCell(5, 23).fill.fgColor.argb).toBe('FF002B7F'); // Step 3 (Primary)
    expect(ws.getCell(5, 28).fill.fgColor.argb).toBe('FF0284C7'); // Step 4 (Secondary)
  });

  it('parses CSV import file into standardized employee records with full fields and document attachments', async () => {
    const mockCsvContent =
      'Full Name,Gender,KTP,NPWP,Nationality,BirthPlace,DOB,Religion,Marital,Email,Phone,CurrentAddress,KtpAddress,Doc KTP,Doc NPWP,Doc KK,Doc Contract,NIP,Dept,Div,Position,EmploymentType,WorkLoc,Shift,Join,End,Status,Bank,AccNo,Holder,BPJSTK,BPJSKES,EmgName,EmgRel,EmgPhone,EmgAddr\n' +
      'Suryadi Pratama,Male,3171015508920020,09.254.678.9-012.000,Indonesia,Jakarta,1992-08-15,Islam,Married,suryadi@indoland.co.id,0812-3456-7899,Jl. Gatot Subroto No. 12,Jl. Gatot Subroto No. 12,KTP_Suryadi.pdf,NPWP_Suryadi.png,KK_Suryadi.pdf,Kontrak_Suryadi.pdf,3171015508920020,Engineering,MEP,Staff MEP,PKWT/KONTRAK,Onsite,Normal (08:00 - 17:00),2024-01-01,2026-01-01,Active,BCA,8271-9920-112,Suryadi Pratama,000189283921,000293849182,Ratna Dewi,Spouse,0812-8899-0011,Jl. Gatot Subroto No. 12';

    const mockFile = {
      name: 'test_import.csv',
      text: async () => mockCsvContent
    };

    const records = await parseEmployeeImportFile(mockFile);
    expect(records.length).toBe(1);
    expect(records[0].name).toBe('Suryadi Pratama');
    expect(records[0].nik).toBe('3171015508920020');
    expect(records[0].departmentId).toBe('dept-eng');
    expect(records[0].position).toBe('Staff MEP');
    expect(records[0].emergencyName).toBe('Ratna Dewi');
    expect(records[0].documents.length).toBe(4);
    expect(records[0].documents[0].name).toBe('KTP_Suryadi.pdf');
    expect(records[0].documents[0].isPdf).toBe(true);
  });

  describe('browser download environment simulation', () => {
    beforeEach(() => {
      globalThis.window = {
        URL: {
          createObjectURL: vi.fn(() => 'blob:mock-excel-url'),
          revokeObjectURL: vi.fn()
        }
      };
      globalThis.document = {
        createElement: vi.fn(() => ({
          href: '',
          download: '',
          click: vi.fn()
        })),
        body: {
          appendChild: vi.fn(),
          removeChild: vi.fn()
        }
      };
    });

    afterEach(() => {
      delete globalThis.window;
      delete globalThis.document;
    });

    it('triggers DOM download when window and document exist', async () => {
      const dummyEmployees = [
        {
          id: 'emp-003',
          nik: '3174052109840008',
          name: 'Siti Rahma',
          email: 'siti@example.com',
          status: 'Resigned'
        }
      ];

      await exportResignedEmployeesToExcel({
        employees: dummyEmployees,
        getDeptName: () => 'HR',
        getDivName: () => 'Talent',
        resolveResignDate: () => '2024-01-01',
        calculateTenure: () => '1 year',
        formatShortDate: (d) => d
      });

      expect(globalThis.window.URL.createObjectURL).toHaveBeenCalled();
      expect(globalThis.document.body.appendChild).toHaveBeenCalled();
      expect(globalThis.document.body.removeChild).toHaveBeenCalled();
      expect(globalThis.window.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
