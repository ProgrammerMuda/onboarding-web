import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { Sidebar } from './Sidebar';
import { SIDEBAR_SECTIONS } from '../../models/SidebarModel';

describe('Sidebar active states', () => {
  it('does NOT highlight dropdown parent when non-dropdown menu (e.g. dashboard) is active', () => {
    const presenter = {
      sections: SIDEBAR_SECTIONS,
      activeItem: 'dashboard',
      expandedItems: { 'hr-parameter': true }, // accordion was expanded
      isCollapsed: false,
      isSidebarOpen: false,
      handleParentClick: () => {},
      handleSubItemClick: () => {},
      openParentFromCollapsed: () => {},
      toggleSidebarMobile: () => {}
    };

    const html = renderToString(<Sidebar presenter={presenter} />);
    
    // Dashboard should have active class
    expect(html).toContain('app-sidebar__item--active');
    
    // But hr-parameter should NOT have parent-active because active item is dashboard!
    expect(html).not.toContain('app-sidebar__item--parent-active');
  });

  it('highlights dropdown parent with parent-active only when its child subitem is active', () => {
    const presenter = {
      sections: SIDEBAR_SECTIONS,
      activeItem: 'hr-departemen',
      expandedItems: { 'hr-parameter': true },
      isCollapsed: false,
      isSidebarOpen: false,
      handleParentClick: () => {},
      handleSubItemClick: () => {},
      openParentFromCollapsed: () => {},
      toggleSidebarMobile: () => {}
    };

    const html = renderToString(<Sidebar presenter={presenter} />);
    
    // hr-parameter should have parent-active
    expect(html).toContain('app-sidebar__item--parent-active');
    // hr-departemen subitem should be active
    expect(html).toContain('app-sidebar__subitem--active');
  });
});
