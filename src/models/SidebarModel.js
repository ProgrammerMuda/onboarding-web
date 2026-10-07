/**
 * SidebarModel - Model Layer (MVP)
 * Defines the updated navigation tree, section headers, icon bindings, and default states.
 */

export const SIDEBAR_SECTIONS = [
  {
    id: 'main',
    title: 'MAIN',
    items: [
      {
        id: 'on-boarding',
        label: 'Onboarding Wizard',
        icon: 'Rocket',
        hasChildren: false
      },
      {
        id: 'lease-contract',
        label: 'Lease Contract',
        icon: 'FileContract',
        hasChildren: false
      },
      {
        id: 'system',
        label: 'System',
        icon: 'Settings',
        hasChildren: true,
        children: [
          { id: 'system-settings', label: 'General Settings' },
          { id: 'system-users', label: 'User Management' },
          { id: 'system-logs', label: 'System Logs' }
        ]
      },
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'PieChart',
        hasChildren: false
      },
      {
        id: 'announcement',
        label: 'Announcement',
        icon: 'Megaphone',
        hasChildren: false
      },
      {
        id: 'tracking-ticket',
        label: 'Tracking Ticket',
        icon: 'Ticket',
        hasChildren: false
      },
      {
        id: 'incidental-report',
        label: 'Incidental Report',
        icon: 'Siren',
        hasChildren: false
      },
      {
        id: 'reminders',
        label: 'Reminders',
        icon: 'Bell',
        hasChildren: false
      },
      {
        id: 'invoice-tenant',
        label: 'Invoice Tenant',
        icon: 'Receipt',
        hasChildren: false
      },
      {
        id: 'landlord',
        label: 'Landlord',
        icon: 'UserCheck',
        hasChildren: false
      }
    ]
  },
  {
    id: 'master-table',
    title: 'MASTER TABLE',
    items: [
      {
        id: 'tr-parameter',
        label: 'TR Parameter',
        icon: 'Database',
        hasChildren: true,
        children: [
          { id: 'tr-category', label: 'TR Category' },
          { id: 'tr-type', label: 'TR Type' }
        ]
      },
      {
        id: 'engineering-parameter',
        label: 'Enginering Parameter',
        icon: 'Database',
        hasChildren: true,
        children: [
          { id: 'eng-equipment', label: 'Equipment Category' },
          { id: 'eng-maintenance', label: 'Maintenance Schedule' }
        ]
      },
      {
        id: 'hk-parameter',
        label: 'HK Parameter',
        icon: 'Database',
        hasChildren: true,
        children: [
          { id: 'hk-cleaning', label: 'Cleaning Checklist' },
          { id: 'hk-inventory', label: 'Consumables Stock' }
        ]
      },
      {
        id: 'fin-parameter',
        label: 'FIN Paramater',
        icon: 'Database',
        hasChildren: true,
        children: [
          { id: 'fin-coa', label: 'Chart of Accounts' },
          { id: 'fin-tax', label: 'Tax Rules' }
        ]
      },
      {
        id: 'hr-parameter',
        label: 'HR Parameter',
        icon: 'Database',
        hasChildren: true,
        children: [
          { id: 'hr-jabatan', label: 'Jabatan' },
          { id: 'hr-shift-type', label: 'Shift Type' },
          { id: 'hr-permit-type', label: 'Permit Type' },
          { id: 'hr-departemen', label: 'Departemen' },
          { id: 'hr-division', label: 'Division' },
          { id: 'hr-agama', label: 'Agama' },
          { id: 'hr-kartu-identitas', label: 'Kartu Identitas' },
          { id: 'hr-jenis-kelamin', label: 'Jenis Kelamin' },
          { id: 'hr-request-approval', label: 'Request Approval' }
        ]
      },
      {
        id: 'hse-parameter',
        label: 'HSE Parameter',
        icon: 'Database',
        hasChildren: false
      }
    ]
  },
  {
    id: 'building-profile',
    title: 'BUILDING PROFILE',
    items: [
      {
        id: 'levels',
        label: 'Levels',
        icon: 'Building2',
        hasChildren: false
      },
      {
        id: 'tenant',
        label: 'Tenant',
        icon: 'Home',
        hasChildren: true,
        children: [
          { id: 'tenant-management', label: 'Tenant Management' },
          { id: 'occupant', label: 'Occupant' },
          { id: 'tenant-member', label: 'Tenant Member' }
        ]
      },
      {
        id: 'tower',
        label: 'Tower',
        icon: 'Building',
        hasChildren: false
      },
      {
        id: 'id-floor',
        label: 'ID Floor',
        icon: 'Layers',
        hasChildren: false
      },
      {
        id: 'rooms',
        label: 'Rooms',
        icon: 'DoorClosed',
        hasChildren: false
      },
      {
        id: 'unit',
        label: 'Unit',
        icon: 'Home',
        hasChildren: false
      }
    ]
  },
  {
    id: 'tenant-relation',
    title: 'TENANT RELATION',
    items: [
      {
        id: 'fitout-permit',
        label: 'Fitout Permit',
        icon: 'Hammer',
        hasChildren: false
      },
      {
        id: 'event-voting',
        label: 'Event Voting',
        icon: 'CalendarCheck',
        hasChildren: false
      }
    ]
  }
];

export class SidebarModel {
  static getDefaultState() {
    return {
      activeItem: 'hr-request-approval',
      activeParent: 'hr-parameter',
      expandedItems: {
        'system': false,
        'tenant': true,
        'tr-parameter': false,
        'engineering-parameter': false,
        'hk-parameter': false,
        'fin-parameter': false,
        'hr-parameter': true
      },
      isSidebarOpen: true
    };
  }
}
