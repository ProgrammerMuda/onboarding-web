// @refresh reset
// Remount on development updates because this component composes presenter hooks.
import React from 'react';
import { Sidebar } from './views/components/Sidebar';
import { TopNavbar } from './views/components/TopNavbar';
import { OnboardingWizardView } from './views/onboarding/OnboardingWizardView';
import { DashboardOverviewView } from './views/dashboard/DashboardOverviewView';
import { TenantManagementView } from './views/tenant/TenantManagementView';
import { ApprovalFlowView } from './views/approval/ApprovalFlowView';
import { PermitTypeView } from './views/permit/PermitTypeView';

// MVP Presenters
import { useSidebarPresenter } from './presenters/useSidebarPresenter';
import { useOnboardingPresenter } from './presenters/useOnboardingPresenter';
import { useDashboardPresenter } from './presenters/useDashboardPresenter';
import { useTenantPresenter } from './presenters/useTenantPresenter';
import { useApprovalFlowPresenter } from './presenters/useApprovalFlowPresenter';
import { usePermitTypePresenter } from './presenters/usePermitTypePresenter';

export default function App() {
  const sidebarPresenter = useSidebarPresenter('hr-permit-type');
  const onboardingPresenter = useOnboardingPresenter();
  const dashboardPresenter = useDashboardPresenter();
  const permitPresenter = usePermitTypePresenter();
  const tenantPresenter = useTenantPresenter();
  const approvalPresenter = useApprovalFlowPresenter();
  
  const activeMenu = sidebarPresenter.sections
    .flatMap((section) => section.items.flatMap((item) => [item, ...(item.children || [])]))
    .find((item) => item.id === sidebarPresenter.activeItem);

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
            {sidebarPresenter.activeItem === 'on-boarding' || sidebarPresenter.activeItem === 'onboarding' ? (
              <OnboardingWizardView 
                presenter={onboardingPresenter} 
                onGoToDashboard={() => sidebarPresenter.handleParentClick({ id: 'dashboard' })} 
              />
            ) : sidebarPresenter.activeItem === 'dashboard' ? (
              <DashboardOverviewView presenter={dashboardPresenter} />
            ) : sidebarPresenter.activeItem === 'tenant-management' ? (
              <TenantManagementView presenter={tenantPresenter} />
            ) : sidebarPresenter.activeItem === 'hr-permit-type' ? (
              <PermitTypeView presenter={permitPresenter} />
            ) : sidebarPresenter.activeItem === 'hr-request-approval' || sidebarPresenter.activeItem === 'approval-flow' ? (
              <ApprovalFlowView presenter={approvalPresenter} />
            ) : (
              <div className="bg-white p-5 border text-center my-4 shadow-sm" style={{ borderRadius: '12px' }}>
                <h4 className="fw-bold text-dark mb-2 text-capitalize">
                  {activeMenu?.label || sidebarPresenter.activeItem.replaceAll('-', ' ')}
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
