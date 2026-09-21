/**
 * OnboardingModel - Model Layer (MVP)
 * Manages domain data structure, initial states, validation logic, and steps metadata.
 */

export const ONBOARDING_STEPS = [
  { id: 1, key: 'account', title: 'Company & Profile', desc: 'Setup your primary organization' },
  { id: 2, key: 'team', title: 'Team Collaboration', desc: 'Invite core team members' },
  { id: 3, key: 'workspace', title: 'Workspace & Addons', desc: 'Configure cloud services' },
  { id: 4, key: 'summary', title: 'Review & Launch', desc: 'Finalize and activate workspace' }
];

export const INDUSTRY_OPTIONS = [
  'Financial Services & Fintech',
  'Healthcare & Life Sciences',
  'Software & Cloud Technology',
  'E-Commerce & Retail',
  'Manufacturing & Logistics',
  'Media & Entertainment'
];

export const WORKSPACE_PLANS = [
  {
    id: 'starter',
    name: 'Starter Cloud',
    price: '$49',
    period: '/month',
    badge: 'Popular for MVPs',
    features: ['Up to 10 Team Members', '100GB Fast NVMe Storage', 'Community & Email Support', 'Automated Daily Backups'],
    recommended: false
  },
  {
    id: 'enterprise',
    name: 'Proapps Enterprise',
    price: '$199',
    period: '/month',
    badge: 'Recommended',
    features: ['Unlimited Team Members', '2TB High-Throughput NVMe', '24/7 Dedicated SLA & Support', 'Advanced RBAC & SSO / SAML', 'Custom Domain & White-labeling'],
    recommended: true
  },
  {
    id: 'scale',
    name: 'Custom Dedicated',
    price: '$499',
    period: '/month',
    badge: 'High Security',
    features: ['Dedicated Kubernetes Cluster', 'Unlimited Scale & Storage', 'HIPAA & SOC-2 Compliance', 'Dedicated Account Manager'],
    recommended: false
  }
];

export const INTEGRATION_OPTIONS = [
  { id: 'github', name: 'GitHub Sync', desc: 'CI/CD Pipelines & Auto Deploy', defaultEnabled: true },
  { id: 'slack', name: 'Slack Alerts', desc: 'Real-time incident & deployment notices', defaultEnabled: true },
  { id: 'analytics', name: 'Proapps Telemetry', desc: 'Real-time performance analytics', defaultEnabled: false },
  { id: 'security', name: 'Zero Trust Guard', desc: 'Continuous vulnerability scanning', defaultEnabled: true }
];

export class OnboardingModel {
  static getInitialState() {
    return {
      currentStep: 1,
      isCompleted: false,
      formData: {
        // Step 1: Account
        companyName: 'Acme Corporation',
        workEmail: 'alex.ross@acme-corp.io',
        fullName: 'Alex Ross',
        phoneNumber: '+62 812-3456-7890',
        industry: 'Software & Cloud Technology',
        companySize: '51-200 employees',
        
        // Step 2: Team Members
        teamMembers: [
          { id: '1', email: 'sarah.c@acme-corp.io', role: 'Admin', status: 'Pending' },
          { id: '2', email: 'david.k@acme-corp.io', role: 'Developer', status: 'Pending' },
          { id: '3', email: 'elena.v@acme-corp.io', role: 'Viewer', status: 'Pending' }
        ],

        // Step 3: Workspace Config
        selectedPlan: 'enterprise',
        workspaceRegion: 'Singapore (ap-southeast-1)',
        subdomain: 'acme-hq',
        integrations: ['github', 'slack', 'security'],
        environment: 'Production',
        twoFactorAuth: true,
        
        // Step 4: Agreed terms
        termsAccepted: true
      },
      errors: {}
    };
  }

  static validateStep(step, data) {
    const errors = {};

    if (step === 1) {
      if (!data.companyName?.trim()) errors.companyName = 'Company name is required.';
      if (!data.fullName?.trim()) errors.fullName = 'Full name is required.';
      if (!data.workEmail?.trim()) {
        errors.workEmail = 'Work email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.workEmail)) {
        errors.workEmail = 'Please provide a valid email address.';
      }
    }

    if (step === 3) {
      if (!data.subdomain?.trim()) {
        errors.subdomain = 'Workspace subdomain is required.';
      } else if (!/^[a-z0-9-]+$/.test(data.subdomain)) {
        errors.subdomain = 'Only lowercase alphanumeric letters and dashes are allowed.';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
