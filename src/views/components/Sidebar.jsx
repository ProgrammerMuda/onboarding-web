import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  FileText, GearSix, ChartPieSlice, MegaphoneSimple, Ticket, Siren,
  Bell, Receipt, UserCheck, Database, Coins, Buildings,
  BuildingApartment, Image as ImageIcon, Door, HouseLine, Hammer,
  CalendarCheck, RocketLaunch, CaretDown, CaretUp,
  X, UsersThree, ClockUser, SignOut, SidebarSimple,
  Sliders, Invoice, Checks, MinusCircle, Wallet, WarningCircle, ChartBar
} from '@phosphor-icons/react';
import { CalendarClock } from 'lucide-react';
import logoImg from '../../assets/proapps-mark-white.svg';
import fullLogoImg from '../../assets/logo.png';
import avatarImg from '../../assets/avatar.png';
import './sidebar.css';

function SidebarCalendarClock({ weight, size = 22, ...props }) {
  const maskId = React.useId();
  if (weight !== 'fill') return <CalendarClock size={size} {...props} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
      <defs>
        <mask id={maskId}>
          <rect x="3" y="4" width="18" height="17" rx="2" fill="white" />
          <path d="M3 9h18" stroke="black" strokeWidth="1.5" />
          <circle cx="17" cy="17" r="7" fill="black" />
          <circle cx="17" cy="17" r="5.5" fill="white" />
          <path d="M17 13.5V17l2.5 1.5" fill="none" stroke="black" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </mask>
      </defs>
      <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect width="24" height="24" mask={`url(#${maskId})`} />
    </svg>
  );
}

const iconMap = {
  CalendarClock: SidebarCalendarClock,
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
  FileText,
  Sliders, Invoice, Checks, MinusCircle, Wallet, WarningCircle, ChartBar
};

export function Sidebar({ presenter }) {
  const {
    sections, activeItem, expandedItems, isCollapsed,
    isSidebarOpen, handleParentClick, handleSubItemClick,
    openParentFromCollapsed, toggleSidebarMobile, toggleSidebarCollapsed
  } = presenter;
  const compact = isCollapsed && !isSidebarOpen;
  const [hasScrolledTop, setHasScrolledTop] = useState(false);
  const [hasScrolledBottom, setHasScrolledBottom] = useState(false);
  const navRef = useRef(null);

  const checkScroll = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const isScrolled = scrollTop > 4;
    const notBottom = scrollHeight - scrollTop - clientHeight > 4;
    setHasScrolledTop(isScrolled);
    setHasScrolledBottom(isScrolled && notBottom);
  }, []);

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [checkScroll, expandedItems, isCollapsed]);

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
      <div className={`app-sidebar__header ${hasScrolledTop ? 'app-sidebar__header--scrolled' : ''}`}>
        {compact ? (
          <button
            type="button"
            className="app-sidebar__logo app-sidebar__logo--clickable"
            onClick={toggleSidebarCollapsed}
            title="Klik logo untuk memperbesar sidebar"
            aria-label="Perbesar sidebar"
          >
            <img src={logoImg} alt="PROAPPS" />
          </button>
        ) : (
          <>
            <div className="app-sidebar__logo" title="PROAPPS">
              <img src={fullLogoImg} alt="PROAPPS" />
            </div>
            <button
              type="button"
              className="app-sidebar__toggle app-sidebar__collapse-btn d-none d-lg-inline-flex"
              onClick={toggleSidebarCollapsed}
              title="Kecilkan sidebar"
              aria-label="Kecilkan sidebar"
            >
              <SidebarSimple size={23} weight="fill" />
            </button>
          </>
        )}
        <button
          type="button"
          className="app-sidebar__toggle app-sidebar__mobile-close d-lg-none"
          onClick={toggleSidebarMobile}
          aria-label="Tutup menu navigasi"
        >
          <X size={20} />
        </button>
      </div>

      <nav
        className="app-sidebar__nav"
        ref={navRef}
        onScroll={checkScroll}
        aria-label="Menu aplikasi"
      >
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
                const hasActiveChild = item.hasChildren && (item.id === activeItem || item.children.some((sub) => sub.id === activeItem));
                const isDirectActive = !item.hasChildren && activeItem === item.id;
                const isParentActive = hasActiveChild;

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
                        {item.children.length === 0 && (
                          <span className="app-sidebar__subitem">Submenu belum tersedia</span>
                        )}
                        {item.children.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            className={`app-sidebar__subitem ${activeItem === sub.id ? 'app-sidebar__subitem--active' : ''}`}
                            onClick={() => handleSubItemClick(sub.id, item.id)}
                            aria-current={activeItem === sub.id ? 'page' : undefined}
                          >
                            <span>{sub.label}</span>
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

      {/* Sidebar Footer: User Card */}
      <div className={`app-sidebar__footer ${hasScrolledBottom ? 'app-sidebar__footer--scrolled' : ''}`}>
        <div className="app-sidebar__user-card" title={compact ? `${(presenter?.user?.name || 'Budi Hartono')} - ${(presenter?.user?.role || 'Building Manager')}` : undefined}>
          <div className="app-sidebar__user-avatar" aria-hidden="true">
            <img src={avatarImg} alt={presenter?.user?.name || 'Budi Hartono'} className="app-sidebar__user-avatar-img" />
          </div>
          {!compact && (
            <div className="app-sidebar__user-info">
              <span className="app-sidebar__user-name">{presenter?.user?.name || 'Budi Hartono'}</span>
              <span className="app-sidebar__user-role">{presenter?.user?.role || 'Building Manager'}</span>
            </div>
          )}
          {!compact && (
            <button
              type="button"
              className="app-sidebar__user-logout"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <SignOut size={18} weight="bold" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
