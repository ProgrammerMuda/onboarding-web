import React from 'react';
import { 
  Palette, 
  Layers, 
  Sparkles, 
  Check, 
  Copy, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  X, 
  Sliders, 
  Search,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

export function ComponentShowcaseView({ presenter }) {
  const {
    palette,
    tableUsers,
    activeTab,
    setActiveTab,
    isModalOpen,
    setIsModalOpen,
    toastMessage,
    showToast,
    buttonLoading,
    simulateAsyncAction,
    demoInput,
    setDemoInput,
    selectedTag,
    setSelectedTag
  } = presenter;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${text} to clipboard!`);
  };

  return (
    <div className="container py-4 py-lg-5" style={{ maxWidth: '1100px' }}>
      {/* Toast Notification Container */}
      {toastMessage && (
        <div 
          className="position-fixed bottom-0 end-0 p-3" 
          style={{ zIndex: 1100 }}
        >
          <div className="alert alert-dark shadow-lg d-flex align-items-center gap-2 mb-0 py-2.5 px-4 text-white border-0 rounded-pill animate__animated animate__fadeInUp">
            <CheckCircle2 size={18} className="text-secondary" />
            <span className="small fw-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Showcase Header */}
      <div className="text-center mb-5">
        <span className="badge badge-subtle-primary rounded-pill px-3 py-1 mb-2 font-monospace small">
          DESIGN SYSTEM & COMPONENT LIBRARY
        </span>
        <h2 className="fw-bold text-dark mb-2">
          Bootstrap 5 + Preline UI Architecture
        </h2>
        <p className="text-muted mx-auto" style={{ maxWidth: '650px' }}>
          Configured with <strong>Primary #053079</strong>, <strong>Secondary #09B2FF</strong>, Preline Slate/Accent scale, and <strong>Montserrat</strong> typography.
        </p>
      </div>

      {/* 1. Color Palette Tokens */}
      <section className="card-modern p-4 p-md-5 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div className="p-2 bg-primary text-white rounded-2">
              <Palette size={20} />
            </div>
            <div>
              <h4 className="fw-bold text-dark mb-0">Brand & Preline Color Tokens</h4>
              <p className="text-muted small mb-0">Primary, Secondary, and Preline UI harmonious neutral/accent palettes</p>
            </div>
          </div>
        </div>

        {/* Primary & Secondary */}
        <h6 className="fw-bold text-dark mb-3">Core Brand Highlights</h6>
        <div className="row g-3 mb-4">
          {palette.brand.map((color) => (
            <div key={color.hex} className="col-12 col-md-6">
              <div 
                className="p-4 rounded-3 text-white d-flex align-items-center justify-content-between shadow-sm cursor-pointer"
                style={{ backgroundColor: color.hex, cursor: 'pointer' }}
                onClick={() => copyToClipboard(color.hex)}
                title="Click to copy HEX code"
              >
                <div>
                  <h5 className="fw-bold mb-1">{color.name}</h5>
                  <div className="font-monospace small opacity-75">{color.hex}</div>
                  <div className="small mt-1 opacity-90">{color.desc}</div>
                </div>
                <button className="btn btn-sm btn-light rounded-pill px-3 fw-semibold">
                  Copy HEX
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Preline Accents */}
        <h6 className="fw-bold text-dark mb-3">Preline UI Accents (Success, Warning, Danger, Info)</h6>
        <div className="row g-2 mb-4">
          {palette.prelineAccents.map((accent) => (
            <div key={accent.hex} className="col-6 col-md-3">
              <div 
                className="p-3 rounded-3 text-white cursor-pointer shadow-sm"
                style={{ backgroundColor: accent.hex }}
                onClick={() => copyToClipboard(accent.hex)}
              >
                <div className="fw-bold small">{accent.name}</div>
                <div className="font-monospace small opacity-90">{accent.hex}</div>
                <div className="badge bg-black bg-opacity-25 rounded-pill px-2 py-0.5 mt-1 small">
                  {accent.type}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Preline Slate Scale */}
        <h6 className="fw-bold text-dark mb-3">Preline Slate Neutral Scale</h6>
        <div className="row g-2">
          {palette.prelineNeutrals.map((neutral) => (
            <div key={neutral.hex} className="col-4 col-md-2">
              <div 
                className={`p-3 rounded-3 border text-center cursor-pointer ${
                  neutral.hex === '#0F172A' || neutral.hex === '#334155' ? 'text-white' : 'text-dark'
                }`}
                style={{ backgroundColor: neutral.hex }}
                onClick={() => copyToClipboard(neutral.hex)}
              >
                <div className="fw-bold small">{neutral.name}</div>
                <div className="font-monospace small opacity-75">{neutral.hex}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Interactive Buttons & Badges */}
      <section className="card-modern p-4 p-md-5 mb-4">
        <h4 className="fw-bold text-dark mb-1">Buttons & Badges System</h4>
        <p className="text-muted small mb-4">Interactive button variants with loading states, gradients, and subtle badges.</p>

        <div className="row g-4">
          {/* Buttons Column */}
          <div className="col-12 col-lg-6">
            <h6 className="fw-bold text-dark mb-3">Action Buttons</h6>
            <div className="d-flex flex-wrap gap-2.5 mb-3">
              <button className="btn btn-primary">Primary (#053079)</button>
              <button className="btn btn-secondary">Secondary (#09B2FF)</button>
              <button className="btn btn-brand-gradient">Brand Gradient</button>
            </div>

            <div className="d-flex flex-wrap gap-2.5 mb-3">
              <button className="btn btn-outline-primary">Outline Primary</button>
              <button className="btn btn-outline-secondary">Outline Secondary</button>
              <button className="btn btn-light border">Light Neutral</button>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-2.5">
              <button 
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={simulateAsyncAction}
                disabled={buttonLoading}
              >
                {buttonLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    <span>Trigger Presenter Action</span>
                  </>
                )}
              </button>

              <button 
                className="btn btn-outline-secondary"
                onClick={() => setIsModalOpen(true)}
              >
                Open Preview Modal
              </button>
            </div>
          </div>

          {/* Badges Column */}
          <div className="col-12 col-lg-6">
            <h6 className="fw-bold text-dark mb-3">Subtle Badges (Preline Style)</h6>
            <div className="d-flex flex-wrap gap-2 mb-3">
              <span className="badge badge-subtle-primary rounded-pill px-3 py-1.5">Primary Navy</span>
              <span className="badge badge-subtle-secondary rounded-pill px-3 py-1.5">Secondary Cyan</span>
              <span className="badge badge-subtle-success rounded-pill px-3 py-1.5">Active / Ready</span>
              <span className="badge badge-subtle-warning rounded-pill px-3 py-1.5">Review Required</span>
              <span className="badge badge-subtle-danger rounded-pill px-3 py-1.5">Failed Node</span>
              <span className="badge badge-subtle-dark rounded-pill px-3 py-1.5">Super Admin</span>
            </div>

            <h6 className="fw-bold text-dark mb-2 mt-4">Pill Tags with Pulse</h6>
            <div className="d-flex flex-wrap gap-2">
              <span className="badge bg-light text-dark border rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2">
                <span className="pulse-dot"></span>
                <span>Real-Time WebSockets</span>
              </span>
              <span className="badge bg-light text-dark border rounded-pill px-3 py-2 d-inline-flex align-items-center gap-2">
                <ShieldCheck size={14} className="text-primary" />
                <span>Zero-Trust Enforced</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Form Controls & Cards */}
      <section className="card-modern p-4 p-md-5 mb-4">
        <h4 className="fw-bold text-dark mb-1">Modern Forms & Inputs</h4>
        <p className="text-muted small mb-4">Custom focus states, preline input styling, and responsive form components.</p>

        <div className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-dark">Workspace Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={demoInput} 
              onChange={(e) => setDemoInput(e.target.value)}
            />
            <div className="form-text small">Instant validation wired via React MVP Presenter</div>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-dark">Security Policy Level</label>
            <select className="form-select">
              <option>Strict Enterprise (MFA Required + IP Whitelisting)</option>
              <option>Standard Development</option>
              <option>Sandbox / Playground</option>
            </select>
          </div>

          <div className="col-12 col-md-6">
            <label className="form-label fw-semibold small text-dark">Search Filter</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <Search size={16} className="text-muted" />
              </span>
              <input type="text" className="form-control border-start-0 ps-0" placeholder="Filter repositories or users..." />
            </div>
          </div>

          <div className="col-12 col-md-6 d-flex align-items-end">
            <div className="form-check form-switch pb-2">
              <input className="form-check-input" type="checkbox" id="autoDeploySwitch" defaultChecked />
              <label className="form-check-label fw-semibold small text-dark" htmlFor="autoDeploySwitch">
                Auto-deploy on GitHub push to <code>main</code>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Data Tables & Lists */}
      <section className="card-modern p-4 p-md-5 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom">
          <div>
            <h4 className="fw-bold text-dark mb-1">Data Table & User Directory</h4>
            <p className="text-muted small mb-0">Formatted with Preline slate borders and status badges.</p>
          </div>
          <button 
            className="btn btn-outline-primary btn-sm rounded-pill px-3"
            onClick={() => showToast('Exporting table records to CSV...')}
          >
            Export Records
          </button>
        </div>

        <div className="table-responsive rounded-3 border">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th className="small text-muted fw-semibold py-3 px-3">User</th>
                <th className="small text-muted fw-semibold py-3">Role</th>
                <th className="small text-muted fw-semibold py-3">Status</th>
                <th className="small text-muted fw-semibold py-3">Assigned Tier</th>
                <th className="small text-muted fw-semibold py-3 text-end px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tableUsers.map((u) => (
                <tr key={u.id}>
                  <td className="px-3">
                    <div className="d-flex align-items-center gap-2.5">
                      <div 
                        className="rounded-circle d-flex align-items-center justify-content-center text-white small fw-bold"
                        style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #053079, #09B2FF)' }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="fw-semibold text-dark small">{u.name}</div>
                        <div className="text-muted" style={{ fontSize: '0.725rem' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-subtle-dark rounded-pill px-2.5 py-1">
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.status === 'Active' ? 'badge-subtle-success' : 'badge-subtle-warning'} rounded-pill px-2.5 py-1`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <span className="badge badge-subtle-primary rounded-pill px-2.5 py-1">
                      {u.plan}
                    </span>
                  </td>
                  <td className="text-end px-3">
                    <button 
                      className="btn btn-outline-secondary btn-sm rounded-2 py-1 px-2.5"
                      onClick={() => showToast(`Opening profile for ${u.name}...`)}
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Interactive Modal */}
      {isModalOpen && (
        <div 
          className="modal d-block" 
          tabIndex="-1" 
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-modern border-0 shadow-lg">
              <div className="modal-header border-bottom">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  Bootstrap 5 Interactive Modal
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p className="text-muted small">
                  This modal is styled using our custom Bootstrap 5 theme with <strong>#053079 Primary</strong> and <strong>#09B2FF Secondary</strong>.
                </p>
                <div className="alert alert-info border-0 rounded-3 small mb-0">
                  <strong>MVP Architecture Note:</strong> State transitions are decoupled cleanly in <code>useComponentsPresenter.js</code>.
                </div>
              </div>
              <div className="modal-footer border-top">
                <button 
                  type="button" 
                  className="btn btn-outline-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Close Modal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={() => {
                    setIsModalOpen(false);
                    showToast('Modal action confirmed!');
                  }}
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
