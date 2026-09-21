import React from 'react';
import { MetricCard } from '../components/MetricCard';
import { 
  Building, 
  Plus, 
  ExternalLink, 
  Zap, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  Terminal, 
  RefreshCw,
  Sparkles,
  Server
} from 'lucide-react';

export function DashboardOverviewView({ presenter, onStartNewOnboarding }) {
  const { currentUser, timeFilter, setTimeFilter, metrics, activities } = presenter;

  return (
    <div className="container-fluid px-3 px-lg-5 py-4">
      {/* Top Banner Greeting */}
      <div className="card-modern p-4 mb-4 bg-gradient-proapps text-white border-0">
        <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 small">
                PROAPPS CLOUD CONTROL
              </span>
              <span className="badge bg-white text-dark rounded-pill px-2.5 py-1 small">
                Active Organization
              </span>
            </div>
            <h2 className="fw-bold mb-1">Welcome back, {currentUser.name}! 👋</h2>
            <p className="text-white-50 mb-0 small">
              All microservices for <strong>{currentUser.organization}</strong> are running optimally with 0 active alerts.
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary fw-semibold d-flex align-items-center gap-2 shadow-sm"
              onClick={onStartNewOnboarding}
            >
              <Plus size={18} />
              <span>Launch New Workspace</span>
            </button>
            <button
              type="button"
              className="btn btn-outline-light d-flex align-items-center gap-1.5"
            >
              <Terminal size={16} />
              <span className="d-none d-sm-inline">CLI Access</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h5 className="fw-bold text-dark mb-0">System Performance & Utilization</h5>
        <div className="btn-group btn-group-sm" role="group">
          {['24h', '7d', '30d', '90d'].map((period) => (
            <button
              key={period}
              type="button"
              className={`btn ${timeFilter === period ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setTimeFilter(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-3 mb-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="col-12 col-sm-6 col-xl-3">
            <MetricCard metric={metric} />
          </div>
        ))}
      </div>

      {/* Two Column Section: Live Workspace & Activity Log */}
      <div className="row g-4">
        {/* Active Workspace Status */}
        <div className="col-12 col-lg-7">
          <div className="card-modern p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
              <div>
                <h5 className="fw-bold text-dark mb-1">Active Cluster Nodes</h5>
                <p className="text-muted small mb-0">High-Availability multi-zone distribution</p>
              </div>
              <span className="badge badge-subtle-success rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5">
                <span className="pulse-dot"></span>
                <span>Healthy Cluster</span>
              </span>
            </div>

            {/* Clusters List */}
            <div className="vstack gap-3 mb-4">
              <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-primary text-white rounded-2">
                    <Server size={20} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark small">acme-production-sg-01</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Singapore (ap-southeast-1) • 8 vCPU / 32GB RAM</div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge badge-subtle-primary">Primary Master</span>
                  <div className="text-muted mt-1" style={{ fontSize: '0.725rem' }}>CPU: 24% • Mem: 48%</div>
                </div>
              </div>

              <div className="p-3 rounded-3 border bg-light d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="p-2 bg-secondary text-white rounded-2">
                    <Server size={20} />
                  </div>
                  <div>
                    <div className="fw-bold text-dark small">acme-staging-jkt-02</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Jakarta (ap-southeast-3) • 4 vCPU / 16GB RAM</div>
                  </div>
                </div>
                <div className="text-end">
                  <span className="badge badge-subtle-secondary">Replica Node</span>
                  <div className="text-muted mt-1" style={{ fontSize: '0.725rem' }}>CPU: 12% • Mem: 32%</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5">
                <RefreshCw size={14} /> Restart Pods
              </button>
              <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5">
                <Terminal size={14} /> View Live Logs
              </button>
              <button className="btn btn-light btn-sm rounded-pill px-3 text-muted d-flex align-items-center gap-1.5">
                <ExternalLink size={14} /> Grafana Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Activity Stream */}
        <div className="col-12 col-lg-5">
          <div className="card-modern p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <h5 className="fw-bold text-dark mb-0">Audit & Security Log</h5>
              <span className="badge badge-subtle-dark rounded-pill px-2.5 py-1 small">Realtime</span>
            </div>

            <div className="vstack gap-3">
              {activities.map((item) => (
                <div key={item.id} className="d-flex align-items-start gap-3 pb-2 border-bottom border-light">
                  <div 
                    className="p-2 rounded-circle mt-0.5 d-flex align-items-center justify-content-center text-white"
                    style={{
                      width: '32px',
                      height: '32px',
                      background: item.type === 'primary' ? '#053079' : item.type === 'secondary' ? '#09B2FF' : '#10B981'
                    }}
                  >
                    <Zap size={14} />
                  </div>
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="fw-semibold text-dark small">{item.action}</span>
                      <span className="text-muted" style={{ fontSize: '0.725rem' }}>{item.time}</span>
                    </div>
                    <div className="text-muted small" style={{ fontSize: '0.8rem' }}>
                      By <span className="text-dark fw-medium">{item.user}</span> → <span className="font-monospace text-primary">{item.target}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center">
              <button className="btn btn-link text-secondary text-decoration-none fw-semibold small p-0">
                View Full Audit Logs & Export CSV →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
