import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../../App';
import EmployeeView from './EmployeeView';
import AddEmployeeView from './AddEmployeeView';
import EmployeeDetailView from './EmployeeDetailView';

describe('App and Employee Views render tests', () => {
  it('renders App without throwing', () => {
    const html = renderToString(<App />);
    expect(html.length).toBeGreaterThan(1000);
  });

  it('renders EmployeeView in list mode with dummy presenter', () => {
    const dummyPresenter = {
      viewMode: 'list',
      selectedEmployee: null,
      openEmployeeDetail: () => {},
      closeEmployeeDetail: () => {},
      openAddEmployeePage: () => {},
      goBackToList: () => {},
      employees: [
        { id: 1, nik: '123', name: 'John Doe', email: 'john@example.com', status: 'Active' },
        { id: 2, nik: '124', name: 'Jane Resigned', email: 'jane@example.com', status: 'Resigned' }
      ],
      filteredEmployees: [
        { id: 1, nik: '123', name: 'John Doe', email: 'john@example.com', status: 'Active' }
      ],
      departments: [{ id: 'dept-bm', name: 'Building Management' }],
      divisions: [{ id: 'div-bm', name: 'General Operation' }],
      positions: [{ id: 'pos-1', name: 'Staff' }],
      stats: { total: 2, active: 1, resigned: 1 },
      searchQuery: '',
      setSearchQuery: () => {},
      statusFilter: 'all',
      setStatusFilter: () => {},
      departmentFilter: 'all',
      setDepartmentFilter: () => {},
      divisionFilter: 'all',
      setDivisionFilter: () => {},
      getDivisionsForDept: () => [],
      getPositionsForDivision: () => [],
      modal: { isOpen: false, data: {} },
      openAddModal: () => {},
      openEditModal: () => {},
      closeModal: () => {},
      saveEmployee: () => {},
      detailModal: { isOpen: false, employee: null },
      openDetailModal: () => {},
      closeDetailModal: () => {},
      deleteModal: { isOpen: false, employee: null },
      openDeleteModal: () => {},
      closeDeleteModal: () => {},
      confirmDelete: () => {},
      successModal: null,
      closeSuccessModal: () => {},
      importEmployees: () => {}
    };

    const html = renderToString(<EmployeeView presenter={dummyPresenter} />);
    expect(html).toContain('John Doe');
  });

  it('renders EmployeeView in add mode', () => {
    const dummyPresenter = {
      viewMode: 'add',
      departments: [],
      divisions: [],
      positions: [],
      wizardStep: 1,
      setWizardStep: () => {},
      wizardDraft: {
        name: '',
        nik: '',
        email: '',
        phone: '',
        position: '',
        departmentId: '',
        divisionId: ''
      },
      updateWizardDraft: () => {},
      getDivisionsForDept: () => [],
      getPositionsForDivision: () => [],
      saveWizardEmployee: () => {},
      goBackToList: () => {},
      modal: { isOpen: false, data: {} }
    };
    const html = renderToString(<EmployeeView presenter={dummyPresenter} />);
    expect(html.length).toBeGreaterThan(100);
  });

  it('renders EmployeeView in edit mode', () => {
    const dummyPresenter = {
      viewMode: 'edit',
      departments: [],
      divisions: [],
      positions: [],
      wizardStep: 1,
      setWizardStep: () => {},
      wizardDraft: {
        name: 'Jane Doe',
        nik: '12345',
        email: 'jane@example.com',
        phone: '08123',
        position: 'Supervisor Account Receivable',
        departmentId: 'dept-fin',
        divisionId: 'div-fin'
      },
      updateWizardDraft: () => {},
      getDivisionsForDept: () => [],
      getPositionsForDivision: () => [],
      saveWizardEmployee: () => {},
      goBackToList: () => {},
      modal: { isOpen: false, data: {} }
    };
    const html = renderToString(<EmployeeView presenter={dummyPresenter} />);
    expect(html.length).toBeGreaterThan(100);
  });

  it('renders EmployeeView in detail mode', () => {
    const dummyPresenter = {
      viewMode: 'detail',
      selectedEmployee: {
        id: 1,
        nik: '123',
        name: 'Budi Santoso',
        position: 'Supervisor Account Receivable',
        departmentId: 'dept-fin',
        divisionId: 'div-fin',
        status: 'Active'
      },
      departments: [],
      divisions: [],
      positions: [],
      closeEmployeeDetail: () => {},
      openEditModal: () => {},
      modal: { isOpen: false, data: {} }
    };
    const html = renderToString(<EmployeeView presenter={dummyPresenter} />);
    expect(html).toContain('Budi Santoso');
  });
});
