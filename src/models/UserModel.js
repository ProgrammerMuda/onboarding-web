/**
 * UserModel - Model Layer (MVP)
 * Manages user entities, role hierarchies, and authentication mock data.
 */

export const USER_ROLES = [
  { value: 'Admin', label: 'Admin (Full Access & Billing)' },
  { value: 'Developer', label: 'Developer (Code, Deployments, Logs)' },
  { value: 'Analyst', label: 'Analyst (Metrics & Reporting)' },
  { value: 'Viewer', label: 'Viewer (Read-only)' }
];

export class UserModel {
  static getCurrentUser() {
    return {
      id: 'usr_proapps_9921',
      name: 'Alex Ross',
      email: 'alex.ross@acme-corp.io',
      role: 'Super Administrator',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      organization: 'Acme Corporation',
      verified: true
    };
  }

  static getMockActivityStream() {
    return [
      { id: 1, action: 'Workspace Created', user: 'Alex Ross', target: 'acme-hq.proapps.io', time: '2 mins ago', type: 'primary' },
      { id: 2, action: 'Team Invite Sent', user: 'System', target: 'sarah.c@acme-corp.io', time: '12 mins ago', type: 'secondary' },
      { id: 3, action: 'GitHub Integration Linked', user: 'David K.', target: 'repo/acme-frontend', time: '45 mins ago', type: 'success' },
      { id: 4, action: 'SSL Certificate Auto-Provisioned', user: 'Security Bot', target: 'Let\'s Encrypt Wildcard', time: '1 hour ago', type: 'info' }
    ];
  }
}
