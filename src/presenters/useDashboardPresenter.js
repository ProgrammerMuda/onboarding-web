import { useState, useMemo } from 'react';
import { UserModel } from '../models/UserModel';

/**
 * useDashboardPresenter - Presenter Layer (MVP)
 * Mediates between UserModel/Analytics data and Dashboard views.
 */
export function useDashboardPresenter() {
  const [currentUser] = useState(UserModel.getCurrentUser());
  const [timeFilter, setTimeFilter] = useState('30d');
  const [activities] = useState(UserModel.getMockActivityStream());

  const metrics = useMemo(() => [
    {
      id: 'm1',
      title: 'Active Workspaces',
      value: '12',
      change: '+18.4%',
      trend: 'up',
      subtitle: 'vs last month',
      variant: 'primary',
      icon: 'Layers'
    },
    {
      id: 'm2',
      title: 'Total Team Seats',
      value: '48 / 50',
      change: '96% utilized',
      trend: 'neutral',
      subtitle: '2 seats remaining',
      variant: 'secondary',
      icon: 'Users'
    },
    {
      id: 'm3',
      title: 'Cluster Health / SLA',
      value: '99.99%',
      change: '+0.02%',
      trend: 'up',
      subtitle: 'Optimal latency (14ms)',
      variant: 'success',
      icon: 'Activity'
    },
    {
      id: 'm4',
      title: 'Security Compliance',
      value: 'SOC-2 Ready',
      change: '100% passed',
      trend: 'up',
      subtitle: '0 vulnerability detected',
      variant: 'info',
      icon: 'ShieldCheck'
    }
  ], []);

  return {
    currentUser,
    timeFilter,
    setTimeFilter,
    metrics,
    activities
  };
}
