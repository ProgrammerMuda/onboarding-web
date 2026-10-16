import React, { useEffect } from 'react';
import {
  FileText, GearSix, ChartPieSlice, MegaphoneSimple, Ticket, Siren,
  Bell, Receipt, UserCheck, Database, Coins, Buildings,
  BuildingApartment, Image as ImageIcon, Door, HouseLine, Hammer,
  CalendarCheck, RocketLaunch, CaretDown, CaretUp,
  X, UsersThree, ClockUser
} from '@phosphor-icons/react';
import logoImg from '../../assets/proapps-mark-white.svg';
import fullLogoImg from '../../assets/logo.png';
import './sidebar.css';

const iconMap = {
  Rocket: RocketLaunch,
  FileContract: FileText,
  Settings: GearSix,
  PieChart: ChartPieSlice,
  Megaphone: MegaphoneSimple,
  Ticket,
  Siren,
  Bell,
  Receipt,
  UserCheck,
  Database,
  Coins,
  Building2: Buildings,
  Building: BuildingApartment,
  Layers: ImageIcon,
  DoorClosed: Door,
  Home: HouseLine,
  Hammer,
  CalendarCheck,
  Image: ImageIcon,
  UsersThree,
  ClockUser,
  FileText
};

export function Sidebar({ presenter }) {
  const {
    sections, activeItem, expandedItems, isCollapsed,
    isSidebarOpen, handleParentClick, handleSubItemClick,
    openParentFromCollapsed, toggleSidebarMobile
  } = presenter;
  const compact = isCollapsed && !isSidebarOpen;

  useEffect(() => {
    if (!isSidebarOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') toggleSidebarMobile();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isSidebarOpen, toggleSidebarMobile]);

  const selectItem = (item) => {
    if (compact && item.hasChildren) {
      openParentFromCollapsed(item);
      return;
    }
    handleParentClick(item);
  };

  return (
    <aside
      className={`app-sidebar ${compact ? 'app-sidebar--collapsed' : ''} ${isSidebarOpen ? 'app-sidebar--mobile-open' : ''}`}
      aria-label="Navigasi utama"
    >
      <div className="app-sidebar__header">
        <div className="app-sidebar__logo" title="PROAPPS">
          <img src={compact ? logoImg : fullLogoImg} alt="PROAPPS" />
        </div>
        <button
          type="button"
          className="app-sidebar__toggle app-sidebar__mobile-close"
          onClick={toggleSidebarMobile}
          aria-label="Tutup menu navigasi"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="app-sidebar__nav" aria-label="Menu aplikasi">
        {sections.map((section) => (
          <div key={section.id} className="app-sidebar__section">
            {section.title && (
              <div
                className="app-sidebar__section-title"
                title={compact ? section.title : undefined}
                aria-label={compact ? section.title : undefined}
              >
                {compact ? section.title.slice(0, 4) : section.title}
              </div>
            )}
            <div className="app-sidebar__items">
              {section.items.map((item) => {
                const Icon = iconMap[item.icon] || Database;
                const isExpanded = !!expandedItems[item.id];
                const hasActiveChild = item.hasChildren && item.children.some((sub) => sub.id === activeItem);
                const isDirectActive = !item.hasChildren && activeItem === item.id;
                const isParentActive = item.hasChildren && (hasActiveChild || isExpanded);

                let itemClass = 'app-sidebar__item';
                if (isDirectActive) {
                  itemClass += ' app-sidebar__item--active';
                } else if (isParentActive) {
                  itemClass += ' app-sidebar__item--parent-active';
                }

                return (
                  <div key={item.id} className="app-sidebar__item-group">
                    <button
                      type="button"
                      className={itemClass}
                      onClick={() => selectItem(item)}
                      aria-label={compact ? item.label : undefined}
                      aria-current={isDirectActive ? 'page' : undefined}
                      aria-expanded={item.hasChildren && !compact ? isExpanded : undefined}
                      title={compact ? item.label : undefined}
                    >
                      <Icon size={22} weight={isDirectActive || hasActiveChild ? 'fill' : 'regular'} aria-hidden="true" />
                      <span className="app-sidebar__item-label">{item.label}</span>
                      {item.hasChildren && (
                        isExpanded
                          ? <CaretUp className="app-sidebar__caret" size={16} aria-hidden="true" />
                          : <CaretDown className="app-sidebar__caret" size={16} aria-hidden="true" />
                      )}
                    </button>
                    {item.hasChildren && isExpanded && !compact && (
                      <div className="app-sidebar__subitems">
                        {item.children.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            className={`app-sidebar__subitem ${activeItem === sub.id ? 'app-sidebar__subitem--active' : ''}`}
                            onClick={() => handleSubItemClick(sub.id, item.id)}
                            aria-current={activeItem === sub.id ? 'page' : undefined}
                          >
                            <span>{sub.label}</span>
                            {activeItem === sub.id && <span className="app-sidebar__active-dot" aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
