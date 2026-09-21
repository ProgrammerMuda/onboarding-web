import React from 'react';
import { 
  Compass, 
  LayoutDashboard, 
  Palette, 
  Bell, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

export function Navbar({ currentView, setCurrentView }) {
  return (
    <header className="sticky-top bg-white border-bottom shadow-sm" style={{ zIndex: 1020 }}>
      {/* Top micro announcement */}
      <div className="bg-gradient-proapps text-white py-1 px-3 d-none d-md-block">
        <div className="container-fluid d-flex justify-content-between align-items-center small">
          <div className="d-flex align-items-center gap-2">
            <span className="pulse-dot"></span>
            <span className="fw-semibold">PROAPPS Platform v2.4</span>
            <span className="text-white-50">|</span>
            <span className="text-white-50">Bootstrap 5.3 + Preline Design System Active</span>
          </div>
          <div className="d-flex align-items-center gap-3">
            <span className="badge bg-secondary text-white rounded-pill px-2.5 py-1 font-monospace small">
              MVP Architecture
            </span>
            <span className="text-white-50 d-flex align-items-center gap-1">
              <ShieldCheck size={14} className="text-success" /> SOC-2 Certified
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav className="navbar navbar-expand-lg navbar-light py-2.5">
        <div className="container-fluid px-3 px-lg-4">
          {/* Logo */}
          <div 
            className="navbar-brand d-flex align-items-center gap-2 py-0 cursor-pointer"
            onClick={() => setCurrentView('onboarding')}
            style={{ cursor: 'pointer' }}
          >
            <div className="bg-primary p-1.5 rounded-3 d-flex align-items-center justify-content-center shadow-sm" style={{ minWidth: '140px', height: '42px' }}>
              <img 
                src={logoImg} 
                alt="PROAPPS" 
                style={{ maxHeight: '28px', maxWidth: '130px', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Navigation Items */}
          <div className="d-flex align-items-center gap-2 order-lg-2">
            <button 
              className="btn btn-light btn-sm rounded-pill p-2 position-relative text-secondary d-none d-sm-inline-flex"
              title="Notifications"
            >
              <Bell size={18} className="text-dark" />
              <span className="position-absolute top-0 start-100 translate-middle p-1 bg-danger border border-light rounded-circle">
                <span className="visually-hidden">New alerts</span>
              </span>
            </button>

            {/* Profile Pill */}
            <div className="d-flex align-items-center gap-2 ps-2 border-start">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm"
                style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #053079, #09B2FF)' }}
              >
                AR
              </div>
              <div className="d-none d-md-block text-start lh-sm">
                <div className="fw-semibold text-dark small">Alex Ross</div>
                <div className="text-muted" style={{ fontSize: '0.725rem' }}>Acme Corp (Admin)</div>
              </div>
            </div>
          </div>

          {/* Nav Pills for Views */}
          <div className="collapse navbar-collapse order-lg-1" id="navbarMain">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0 gap-1 gap-lg-2">
              <li className="nav-item">
                <button
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2 border-0 ${
                    currentView === 'onboarding' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-dark bg-transparent hover-bg-light'
                  }`}
                  onClick={() => setCurrentView('onboarding')}
                >
                  <Compass size={17} />
                  <span>Onboarding Flow</span>
                  {currentView === 'onboarding' && (
                    <span className="badge bg-secondary text-white rounded-pill px-2 py-0.5 ms-1 small">Active</span>
                  )}
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2 border-0 ${
                    currentView === 'dashboard' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-dark bg-transparent'
                  }`}
                  onClick={() => setCurrentView('dashboard')}
                >
                  <LayoutDashboard size={17} />
                  <span>Executive Dashboard</span>
                </button>
              </li>

              <li className="nav-item">
                <button
                  className={`nav-link px-3 py-2 rounded-pill fw-semibold d-flex align-items-center gap-2 border-0 ${
                    currentView === 'showcase' 
                      ? 'bg-primary text-white shadow-sm' 
                      : 'text-dark bg-transparent'
                  }`}
                  onClick={() => setCurrentView('showcase')}
                >
                  <Palette size={17} />
                  <span>Bootstrap 5 & Preline UI Kit</span>
                  <span className="badge badge-subtle-secondary rounded-pill px-2 py-0.5 ms-1">Colors</span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
