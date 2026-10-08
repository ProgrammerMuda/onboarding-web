import { useState, useCallback } from 'react';
import { SIDEBAR_SECTIONS, SidebarModel } from '../models/SidebarModel';

/**
 * useSidebarPresenter - Presenter Layer (MVP)
 * Mediates between SidebarModel data and the Sidebar View.
 */
export function useSidebarPresenter(initialActive = 'hr-permit-type') {
  const [state, setState] = useState(() => {
    const defaultState = SidebarModel.getDefaultState();
    if (initialActive) {
      defaultState.activeItem = initialActive;
      if (initialActive === 'hr-permit-type' || initialActive === 'hr-shift-type' || initialActive === 'hr-request-approval') {
        defaultState.activeParent = 'hr-parameter';
        defaultState.expandedItems['hr-parameter'] = true;
      }
    }
    return defaultState;
  });

  // Toggle or activate a parent item
  const handleParentClick = useCallback((item) => {
    setState((prev) => {
      const isCurrentlyExpanded = !!prev.expandedItems[item.id];
      const isCurrentlyActiveParent = prev.activeParent === item.id;

      if (item.hasChildren && item.children && item.children.length > 0) {
        // If clicking a new parent, open it and select its first child
        if (!isCurrentlyActiveParent) {
          return {
            ...prev,
            activeParent: item.id,
            activeItem: item.children[0].id,
            expandedItems: {
              ...prev.expandedItems,
              [item.id]: true
            }
          };
        }

        // If clicking the currently active parent, toggle expand/collapse
        return {
          ...prev,
          expandedItems: {
            ...prev.expandedItems,
            [item.id]: !isCurrentlyExpanded
          }
        };
      }

      // Standalone item without children
      return {
        ...prev,
        activeItem: item.id,
        activeParent: item.id
      };
    });
  }, []);

  // Select a specific sub-item under a parent
  const handleSubItemClick = useCallback((subId, parentId) => {
    setState((prev) => ({
      ...prev,
      activeItem: subId,
      activeParent: parentId,
      expandedItems: {
        ...prev.expandedItems,
        [parentId]: true
      }
    }));
  }, []);

  const toggleSidebarMobile = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isSidebarOpen: !prev.isSidebarOpen
    }));
  }, []);

  return {
    sections: SIDEBAR_SECTIONS,
    activeItem: state.activeItem,
    activeParent: state.activeParent,
    expandedItems: state.expandedItems,
    isSidebarOpen: state.isSidebarOpen,
    handleParentClick,
    handleSubItemClick,
    toggleSidebarMobile
  };
}
