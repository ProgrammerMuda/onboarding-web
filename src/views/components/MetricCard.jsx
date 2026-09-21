import React from 'react';
import { 
  Layers, 
  Users, 
  Activity, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Minus 
} from 'lucide-react';

const iconMap = {
  Layers: Layers,
  Users: Users,
  Activity: Activity,
  ShieldCheck: ShieldCheck
};

export function MetricCard({ metric }) {
  const IconComponent = iconMap[metric.icon] || Activity;

  const getVariantStyles = () => {
    switch (metric.variant) {
      case 'primary':
        return {
          iconBg: 'rgba(5, 48, 121, 0.1)',
          iconColor: '#053079',
          borderColor: 'rgba(5, 48, 121, 0.2)'
        };
      case 'secondary':
        return {
          iconBg: 'rgba(9, 178, 255, 0.12)',
          iconColor: '#0088cc',
          borderColor: 'rgba(9, 178, 255, 0.25)'
        };
      case 'success':
        return {
          iconBg: 'rgba(16, 185, 129, 0.12)',
          iconColor: '#059669',
          borderColor: 'rgba(16, 185, 129, 0.25)'
        };
      case 'info':
        return {
          iconBg: 'rgba(14, 165, 233, 0.12)',
          iconColor: '#0284c7',
          borderColor: 'rgba(14, 165, 233, 0.25)'
        };
      default:
        return {
          iconBg: '#f1f5f9',
          iconColor: '#475569',
          borderColor: '#e2e8f0'
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="card-modern card-modern-hoverable p-4 h-100">
      <div className="d-flex align-items-start justify-content-between mb-3">
        <div>
          <span className="text-muted small fw-semibold text-uppercase tracking-wider">
            {metric.title}
          </span>
          <h3 className="fw-bold mt-1 mb-0 text-dark">
            {metric.value}
          </h3>
        </div>
        <div 
          className="p-2.5 rounded-3 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: styles.iconBg, color: styles.iconColor }}
        >
          <IconComponent size={22} />
        </div>
      </div>

      <div className="d-flex align-items-center gap-2 pt-2 border-top border-light-subtle">
        <span className={`badge ${
          metric.trend === 'up' ? 'badge-subtle-success' : 'badge-subtle-secondary'
        } rounded-pill d-flex align-items-center gap-1 py-1 px-2`}>
          {metric.trend === 'up' && <TrendingUp size={12} />}
          {metric.trend === 'down' && <TrendingDown size={12} />}
          {metric.trend === 'neutral' && <Minus size={12} />}
          {metric.change}
        </span>
        <span className="text-muted small">
          {metric.subtitle}
        </span>
      </div>
    </div>
  );
}
