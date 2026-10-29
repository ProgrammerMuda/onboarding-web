import { useState, useMemo, useCallback } from 'react';
import { TenantModel, TOWER_OPTIONS, UNIT_OPTIONS, ROLE_OPTIONS, importRowsToTenants, importRowsToTenantUnits } from '../models/TenantModel';
import { SEED_UNITS, mergeUnits, readCustomUnits } from '../models/UnitModel';
import { buildTenantManagementWorkbook } from '../utils/tenantMemberExcel';
import { protectScheduleWorkbook } from '../utils/workScheduleExcel';
import { downloadWorkbook, parseTenantImportFile, parseTenantUnitImportFile } from '../utils/excelExport';

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

  // Kept in state so imported tenants and units show up in the list right away (in memory, like the mock data).
  const [rawTenants, setRawTenants] = useState(() => TenantModel.getAllTenants());

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

  // Live filters for the list toolbar: each change applies at once. The tab keeps its role.
  const setFilter = useCallback((key, value) => {
    if (key === 'tower') setFilterTower(value);
    else if (key === 'unit') setFilterUnit(value);
    else if (key === 'name') setFilterName(value);
    setAppliedFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
    setGoToPageInput('1');
  }, []);

  const resetFilters = useCallback(() => {
    setFilterTower('');
    setFilterUnit('');
    setFilterName('');
    setAppliedFilters(prev => ({ ...prev, tower: '', unit: '', name: '' }));
    setCurrentPage(1);
    setGoToPageInput('1');
  }, []);

  const hasActiveFilters = Boolean(appliedFilters.tower || appliedFilters.unit || appliedFilters.name);

  // Exports every tenant that matches the current tab and filters, not only the visible page.
  const [exporting, setExporting] = useState(false);
  const exportExcel = useCallback(async () => {
    setExporting(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const workbook = buildTenantManagementWorkbook({ tenants: filteredTenants, exportedOn: today });
      await protectScheduleWorkbook(workbook);
      await downloadWorkbook(workbook, `tenant-management-${today}.xlsx`);
    } finally {
      setExporting(false);
    }
  }, [filteredTenants]);

  // Import: the file is read and every row checked before anything is added.
  const prepareTenantImport = useCallback(async (file) => {
    const rows = await parseTenantImportFile(file);
    const { tenants, errors } = importRowsToTenants(rows, rawTenants);
    return { ready: tenants.length, errors, payload: tenants };
  }, [rawTenants]);

  const importTenants = useCallback((tenants) => {
    setRawTenants((prev) => [...tenants, ...prev]);
    setCurrentPage(1);
    setGoToPageInput('1');
    return tenants.length;
  }, []);

  const prepareTenantUnitImport = useCallback(async (file) => {
    const rows = await parseTenantUnitImportFile(file);
    const knownUnits = [
      ...mergeUnits(SEED_UNITS, readCustomUnits()).map((u) => ({ code: u.code, tower: u.tower })),
      ...rawTenants.flatMap((t) => t.units.map((u) => ({ code: u.code, tower: u.tower })))
    ];
    const { assignments, errors } = importRowsToTenantUnits(rows, rawTenants, knownUnits);
    return { ready: assignments.length, errors, payload: assignments };
  }, [rawTenants]);

  const importTenantUnits = useCallback((assignments) => {
    setRawTenants((prev) => prev.map((t) => {
      const added = assignments.filter((a) => a.tenantId === t.id).map((a) => a.unit);
      return added.length ? { ...t, units: [...t.units, ...added] } : t;
    }));
    return assignments.length;
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
    return rawTenants.find((t) => t.id === Number(selectedTenantId)) ?? null;
  }, [selectedTenantId, rawTenants]);

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
    setFilter,
    resetFilters,
    hasActiveFilters,
    exportExcel,
    exporting,
    prepareTenantImport,
    importTenants,
    prepareTenantUnitImport,
    importTenantUnits,
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
