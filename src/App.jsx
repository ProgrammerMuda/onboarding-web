import React from 'react';
import { Sidebar } from './views/components/Sidebar';
import { TopNavbar } from './views/components/TopNavbar';
import { TenantManagementView } from './views/tenant/TenantManagementView';
import { ApprovalFlowView } from './views/approval/ApprovalFlowView';

// MVP Presenters
import { useSidebarPresenter } from './presenters/useSidebarPresenter';
import { useTenantPresenter } from './presenters/useTenantPresenter';
import { useApprovalFlowPresenter } from './presenters/useApprovalFlowPresenter';

export default function App() {
  const sidebarPresenter = useSidebarPresenter('hr-request-approval');
  const tenantPresenter = useTenantPresenter();
  const approvalPresenter = useApprovalFlowPresenter();

  return (
    <div className="d-flex vh-100 overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
      {/* Left Navigation Sidebar - Fixed in place */}
      <Sidebar presenter={sidebarPresenter} />

      {/* Main Workspace Area */}
      <div className="flex-grow-1 d-flex flex-column h-100 overflow-hidden" style={{ backgroundColor: '#F1F5F9', minWidth: 0 }}>
        {/* Top Horizontal Navbar - Fixed at top */}
        <TopNavbar onToggleMobileSidebar={sidebarPresenter.toggleSidebarMobile} />

        {/* Content Canvas - Spacious Slate 100 Container with independent scrolling */}
        <main 
          className="flex-grow-1 overflow-y-auto" 
          style={{ 
            backgroundColor: '#F1F5F9', 
            padding: '24px 32px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 transparent'
          }}
        >
          <div className="container-fluid p-0">
            {sidebarPresenter.activeItem === 'tenant-management' ? (
              <TenantManagementView presenter={tenantPresenter} />
            ) : sidebarPresenter.activeItem === 'hr-request-approval' || sidebarPresenter.activeItem === 'approval-flow' ? (
              <ApprovalFlowView presenter={approvalPresenter} />
            ) : (
              <div className="bg-white p-5 border text-center my-4 shadow-sm" style={{ borderRadius: '12px' }}>
                <h4 className="fw-bold text-dark mb-2 text-capitalize">
                  {sidebarPresenter.activeItem.replace('-', ' ')}
                </h4>
                <p className="text-muted mb-0">
                  This module is ready to connect with the next View & Model.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
