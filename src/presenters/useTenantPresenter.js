import { useState, useMemo, useCallback } from 'react';
import { TenantModel, TOWER_OPTIONS, UNIT_OPTIONS, ROLE_OPTIONS } from '../models/TenantModel';

/**
 * useTenantPresenter - Presenter Layer (MVP)
 * Mediates between TenantModel data and TenantManagementView.
 */
export function useTenantPresenter() {
  const stats = useMemo(() => {
    const raw = TenantModel.getStats() || {};
    return {
      totalActiveTenants: raw.totalActiveTenants ?? 1169,
      owners: raw.owners ?? raw.totalOwners ?? 1084,
      activeRenters: raw.activeRenters ?? raw.totalRenter ?? 85,
      activeProxies: raw.activeProxies ?? 14
    };
  }, []);

  const [activeTab, setActiveTabState] = useState('all'); // 'all' | 'owners' | 'renters' | 'proxies'
  
  // Filter form state
  const [filterTower, setFilterTower] = useState('');
  const [filterUnit, setFilterUnit] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterName, setFilterName] = useState('');
  
  // Applied filters
  const [appliedFilters, setAppliedFilters] = useState({
    tower: '',
    unit: '',
    role: '',
    name: ''
  });

  // Pagination state
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPageInput, setGoToPageInput] = useState('1');

  const rawTenants = useMemo(() => TenantModel.getAllTenants(), []);

  // Set active tab and reset page to 1
  const setActiveTab = useCallback((tabId) => {
    setActiveTabState(tabId);
    // Also sync filterRole if needed
    if (tabId === 'owners') setFilterRole('OWNER');
    else if (tabId === 'renters') setFilterRole('RENTER');
    else if (tabId === 'proxies') setFilterRole('PROXY');
    else setFilterRole('');

    setAppliedFilters(prev => ({
      ...prev,
      role: tabId === 'owners' ? 'OWNER' : tabId === 'renters' ? 'RENTER' : tabId === 'proxies' ? 'PROXY' : ''
    }));
    setCurrentPage(1);
    setGoToPageInput('1');
  }, []);

  // Handle live name search
  const handleNameSearchChange = useCallback((val) => {
    setFilterName(val);
    setAppliedFilters(prev => ({
      ...prev,
      name: val
    }));
    setCurrentPage(1);
    setGoToPageInput('1');
  }, []);

  // Filtered dataset
  const filteredTenants = useMemo(() => {
    const query = (appliedFilters.name || '').toLowerCase().trim();
    const hasSearchQuery = query.length > 0;
    
    // Explicit role filter from dropdown vs tab
    const explicitRole = appliedFilters.role;
    const tabRole = activeTab === 'owners' ? 'OWNER' : 
                    activeTab === 'renters' ? 'RENTER' : 
                    activeTab === 'proxies' ? 'PROXY' : '';

    return rawTenants
      .filter((tenant) => {
        // 1. Name / Keyword Search Filter (Tenant Name, Email, NIK, Phone, Member Names, Unit codes & Unit Members)
        if (hasSearchQuery) {
          const matchTenantName = tenant.name.toLowerCase().includes(query);
          const matchEmail = (tenant.email || '').toLowerCase().includes(query);
          const matchNik = (tenant.nik || '').includes(query);
          const matchPhone = (tenant.phone || '').includes(query);
          const matchTenantMembers = (tenant.members || []).some(m => 
            (m.name || '').toLowerCase().includes(query) || (m.email || '').toLowerCase().includes(query)
          );
          const matchUnitCode = (tenant.units || []).some(u => (u.code || '').toLowerCase().includes(query));
          const matchUnitMembers = (tenant.units || []).some(u => 
            (u.members || []).some(m => (m.name || '').toLowerCase().includes(query) || (m.email || '').toLowerCase().includes(query))
          );

          const matchesAnyKeyword = matchTenantName || matchEmail || matchNik || matchPhone || matchTenantMembers || matchUnitCode || matchUnitMembers;
          if (!matchesAnyKeyword) return false;
        }

        // 2. Role / Tab Filter
        // When a search query is active, allow matching tenants to show even if tab was set, or respect explicit filter
        const effectiveRole = explicitRole || tabRole;
        if (effectiveRole) {
          // If searching by name and tenant name directly matches or unit member matches, don't hide them
          const hasMatchingRole = tenant.units.some((u) => u.role === effectiveRole) || 
                                  (tenant.type && tenant.type.toUpperCase() === effectiveRole);
          
          if (!hasMatchingRole && !hasSearchQuery) {
            return false;
          }
        }

        // 3. Unit filter
        if (appliedFilters.unit) {
          const hasUnit = tenant.units.some((u) => u.code === appliedFilters.unit);
          if (!hasUnit) return false;
        }

        // 4. Tower filter
        if (appliedFilters.tower) {
          const hasTower = tenant.units.some((u) => {
            if (appliedFilters.tower === 'Tower A') return u.code.startsWith('A');
            if (appliedFilters.tower === 'Tower B') return u.code.startsWith('B');
            if (appliedFilters.tower === 'Tower C') return u.code.startsWith('C');
            if (appliedFilters.tower === 'Tower D') return u.code.startsWith('D');
            return true;
          });
          if (!hasTower) return false;
        }

        return true;
      })
      .map((tenant) => {
        // When filtering by an explicit role without search, display only those units
        const effectiveRole = explicitRole || tabRole;
        if (effectiveRole && !hasSearchQuery) {
          return {
            ...tenant,
            units: tenant.units.filter((u) => u.role === effectiveRole)
          };
        }
        return tenant;
      });
  }, [rawTenants, activeTab, appliedFilters]);

  const totalRecords = filteredTenants.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;

  // Paginated dataset
  const paginatedTenants = useMemo(() => {
    const safePage = Math.min(Math.max(currentPage, 1), totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return filteredTenants.slice(startIndex, startIndex + pageSize);
  }, [filteredTenants, currentPage, pageSize, totalPages]);

  // Actions
  const applyFilter = useCallback(() => {
    // Map role back to tab if applicable
    if (filterRole === 'OWNER') setActiveTabState('owners');
    else if (filterRole === 'RENTER') setActiveTabState('renters');
    else if (filterRole === 'PROXY') setActiveTabState('proxies');
    else setActiveTabState('all');

    setAppliedFilters({
      tower: filterTower,
      unit: filterUnit,
      role: filterRole,
      name: filterName
    });
    setCurrentPage(1);
    setGoToPageInput('1');
  }, [filterTower, filterUnit, filterRole, filterName]);

  const resetFilter = useCallback(() => {
    setFilterTower('');
    setFilterUnit('');
    setFilterRole('');
    setFilterName('');
    setActiveTabState('all');
    setAppliedFilters({
      tower: '',
      unit: '',
      role: '',
      name: ''
    });
    setCurrentPage(1);
    setGoToPageInput('1');
  }, []);

  const handleGoToPage = useCallback(() => {
    const pageNum = parseInt(goToPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  }, [goToPageInput, totalPages]);

  // Detail View State
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [detailActiveTab, setDetailActiveTab] = useState('information'); // 'information' | 'units' | 'members' | 'vehicles'

  const selectedTenant = useMemo(() => {
    if (!selectedTenantId) return null;
    return TenantModel.getTenantById(selectedTenantId);
  }, [selectedTenantId]);

  const handleViewDetails = useCallback((tenantId) => {
    setSelectedTenantId(tenantId);
    setDetailActiveTab('information');
    setViewMode('detail');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedTenantId(null);
  }, []);

  return {
    stats,
    activeTab,
    setActiveTab,
    towerOptions: TOWER_OPTIONS,
    unitOptions: UNIT_OPTIONS,
    roleOptions: ROLE_OPTIONS,
    filterTower,
    setFilterTower,
    filterUnit,
    setFilterUnit,
    filterRole,
    setFilterRole,
    filterName,
    setFilterName,
    handleNameSearchChange,
    tenants: paginatedTenants,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    totalPages,
    totalRecords,
    goToPageInput,
    setGoToPageInput,
    applyFilter,
    resetFilter,
    handleGoToPage,
    // Detail View properties
    viewMode,
    selectedTenant,
    detailActiveTab,
    setDetailActiveTab,
    handleViewDetails,
    handleBackToList
  };
}
