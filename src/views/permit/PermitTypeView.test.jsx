import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { PermitTypeView } from './PermitTypeView';
import { usePermitTypePresenter } from '../../presenters/usePermitTypePresenter';

// Real presenter with per-test overrides, so every tab and modal gets rendered at least once.
function Harness({ overrides = {} }) {
  const presenter = usePermitTypePresenter();
  return <PermitTypeView presenter={{ ...presenter, ...overrides }} />;
}

const render = (overrides) => renderToString(<Harness overrides={overrides} />);

describe('PermitTypeView renders', () => {
  it('renders the leave types tab', () => {
    expect(render({ activeTab: 'policies' })).toContain('Leave and permit policies');
  });

  it('renders the holiday calendar and table views', () => {
    expect(render({ activeTab: 'holidays', holidayViewMode: 'calendar' })).toContain('Holiday Calendar');
    expect(render({ activeTab: 'holidays', holidayViewMode: 'table' })).toContain('Departments');
  });

  it('renders the balances directory', () => {
    const html = render({ activeTab: 'balances' });
    expect(html).toContain('Employee leave balances');
    expect(html).toContain('Collective leave');
    expect(html).not.toContain('Direktori');
  });

  it('renders the adjustment request and ledger modals in English', () => {
    const base = usePermitTypePresenterSeed();
    const html = render({
      activeTab: 'balances',
      adjustmentTarget: base,
      adjDraft: { type: 'deduct', amount: 5, reasonNote: '' },
      simulatedBalance: -2,
      selectedLedgerEmp: base
    });
    expect(html).toContain('Request balance adjustment');
    expect(html).toContain('Building Manager');
    expect(html).toContain('Balance ledger');
    expect(html).not.toContain('>Reference<');
    expect(html).toContain('From adjustment request');
    expect(html).toContain('Adjustments');
    expect(html).not.toContain('Koreksi');
    expect(html).not.toContain('Reason category');
    expect(html).toContain('ADJ-002');
    expect(html).toContain('Anisa Maharani');
    expect(html).toContain('Approved by');
  });

  it('paginates the balance history only when there are more than 5 entries', () => {
    const base = usePermitTypePresenterSeed();
    const entries = (count) => Array.from({ length: count }, (_, i) => ({
      id: `tx-${i}`, date: `2026-0${(i % 9) + 1}-10`, type: 'leave_taken', amount: -1, balanceAfter: 11 - i,
      description: `Leave ${i}`, refNo: `LV-${i}`, approvedBy: 'HR'
    }));

    const long = render({ activeTab: 'balances', selectedLedgerEmp: { ...base, ledger: entries(7) } });
    expect(long).toContain('History Balance');
    expect(long).toContain('entries pagination');

    const short = render({ activeTab: 'balances', selectedLedgerEmp: { ...base, ledger: entries(5) } });
    expect(short).not.toContain('entries pagination');
  });
});

function usePermitTypePresenterSeed() {
  return {
    employeeId: 'emp-001',
    employeeName: 'Test Employee',
    nik: '123',
    departmentId: 'dept-eng',
    baseEntitlement: 12,
    carryOver: 2,
    usedLeave: 1,
    cutiBersamaDeduction: 2,
    available: 3,
    adjustmentTotal: 0,
    carryOverExpiry: '2026-03-31',
    ledger: [
      { id: 'tx-1', date: '2026-01-01', type: 'entitlement', amount: 12, balanceAfter: 12, description: 'Annual leave entitlement 2026', refNo: 'SYS', approvedBy: 'Auto System' },
      { id: 'tx-2', date: '2026-10-19', type: 'adjustment', amount: -1, balanceAfter: 11, description: 'Manual adjustment: test', refNo: 'ADJ-002', ticketId: 'adj-002', requestedBy: 'Anisa Maharani', approvedBy: 'Building Manager' }
    ]
  };
}
