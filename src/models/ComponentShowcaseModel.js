/**
 * ComponentShowcaseModel - Model Layer (MVP)
 * Manages color tokens, component definitions, and interactive showcase test beds.
 */

export const THEME_PALETTE = {
  brand: [
    { name: 'Primary Navy', hex: '#053079', desc: 'Core brand action & primary background', class: 'bg-primary' },
    { name: 'Secondary Cyan', hex: '#09B2FF', desc: 'Accent glow, secondary buttons & highlights', class: 'bg-secondary' }
  ],
  prelineNeutrals: [
    { name: 'Slate 50', hex: '#F8FAFC', class: 'bg-light' },
    { name: 'Slate 100', hex: '#F1F5F9', class: '' },
    { name: 'Slate 200', hex: '#E2E8F0', class: '' },
    { name: 'Slate 400', hex: '#94A3B8', class: '' },
    { name: 'Slate 700', hex: '#334155', class: '' },
    { name: 'Slate 900', hex: '#0F172A', class: 'bg-dark' }
  ],
  prelineAccents: [
    { name: 'Preline Emerald', hex: '#10B981', type: 'Success', class: 'bg-success' },
    { name: 'Preline Amber', hex: '#F59E0B', type: 'Warning', class: 'bg-warning' },
    { name: 'Preline Red', hex: '#EF4444', type: 'Danger', class: 'bg-danger' },
    { name: 'Preline Sky', hex: '#0EA5E9', type: 'Info', class: 'bg-info' }
  ]
};

export const MOCK_TABLE_USERS = [
  { id: 'USR-101', name: 'Rian Maulana', email: 'rian@proapps.id', role: 'Owner', status: 'Active', plan: 'Enterprise', mfa: true },
  { id: 'USR-102', name: 'Sarah Jenkins', email: 'sarah.j@proapps.id', role: 'DevOps Lead', status: 'Active', plan: 'Enterprise', mfa: true },
  { id: 'USR-103', name: 'Kenji Sato', email: 'kenji@proapps.id', role: 'UI Engineer', status: 'Pending', plan: 'Starter', mfa: false },
  { id: 'USR-104', name: 'Maria Gomez', email: 'maria@proapps.id', role: 'Product Manager', status: 'Active', plan: 'Enterprise', mfa: true }
];
