import React from 'react';
import { 
  FileText, 
  GearSix, 
  ChartPieSlice, 
  MegaphoneSimple, 
  Ticket, 
  Siren, 
  Bell, 
  Receipt, 
  UserCheck, 
  Database, 
  Coins,
  Buildings, 
  BuildingApartment, 
  Image as ImageIcon, 
  Door, 
  HouseLine, 
  HouseSimple, 
  Hammer, 
  CalendarCheck, 
  RocketLaunch,
  CaretDown, 
  CaretUp 
} from '@phosphor-icons/react';
import logoImg from '../../assets/logo.png';

// Phosphor Icon Mapping
const iconMap = {
  Rocket: RocketLaunch,
  FileContract: FileText,
  Settings: GearSix,
  PieChart: ChartPieSlice,
  Megaphone: MegaphoneSimple,
  Ticket: Ticket,
  Siren: Siren,
  Bell: Bell,
  Receipt: Receipt,
  UserCheck: UserCheck,
  Database: Database,
  Coins: Coins,
  Building2: Buildings,
  Building: BuildingApartment,
  Layers: ImageIcon,
  DoorClosed: Door,
  Home: HouseLine,
  Hammer: Hammer,
  CalendarCheck: CalendarCheck,
  Image: ImageIcon
};

export function Sidebar({ presenter }) {
  const {
    sections,
    activeItem,
    activeParent,
    expandedItems,
    handleParentClick,
    handleSubItemClick
  } = presenter;

  return (
    <aside 
      className="d-flex flex-column text-white position-relative border-end flex-shrink-0"
      style={{
        width: '280px',
        minWidth: '280px',
        maxWidth: '280px',
        backgroundColor: '#002B7F',
        height: '100vh',
        borderColor: 'rgba(255, 255, 255, 0.08)',
        fontFamily: "'Montserrat', sans-serif",
        zIndex: 1000
      }}
    >
      {/* 1. Header with PROAPPS Logo */}
      <div className="px-4 pt-4 pb-2">
        <div className="d-flex align-items-center">
          <img 
            src={logoImg} 
            alt="PROAPPS" 
            style={{ maxHeight: '34px', maxWidth: '170px', objectFit: 'contain' }}
          />
        </div>
      </div>

      {/* 2. Scrollable Navigation Menu with Phosphor Icons */}
      <div 
        className="flex-grow-1 overflow-y-auto px-3 py-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.2) transparent'
        }}
      >
        {sections.map((section, sIndex) => (
          <div key={section.id} className={sIndex === 0 ? 'mb-4' : 'mb-4 pt-2'}>
            {/* Section Title */}
            {section.title && (
              <div 
                className="px-3 mb-2.5 fw-bold text-uppercase"
                style={{
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  color: '#8EAAD6'
                }}
              >
                {section.title}
              </div>
            )}

            {/* Section Items */}
            <div className="vstack gap-2">
              {section.items.map((item) => {
                const IconComponent = iconMap[item.icon] || Database;
                const isExpanded = !!expandedItems[item.id];
                const isParentActive = activeParent === item.id;
                const isDirectActive = activeItem === item.id;

                if (item.hasChildren) {
                  return (
                    <div key={item.id} className="w-100">
                      {/* Parent Accordion Button */}
                      <button
                        type="button"
                        className={`btn w-100 d-flex align-items-center justify-content-between px-3 py-2.5 border-0 text-start ${
                          isParentActive 
                            ? 'text-white' 
                            : 'text-white text-opacity-90 hover-bg-white-10'
                        }`}
                        style={{
                          backgroundColor: isParentActive ? '#00B0FF' : 'transparent',
                          borderRadius: '0.55rem',
                          fontSize: '0.875rem',
                          fontWeight: isParentActive ? 600 : 500,
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onClick={() => handleParentClick(item)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <IconComponent 
                            size={20} 
                            weight={isParentActive ? 'fill' : 'regular'} 
                            className="flex-shrink-0" 
                          />
                          <span>{item.label}</span>
                        </div>
                        {isExpanded ? (
                          <CaretUp size={16} weight="bold" className="opacity-90" />
                        ) : (
                          <CaretDown size={16} weight="bold" className="opacity-75" />
                        )}
                      </button>

                      {/* Accordion Sub-menu */}
                      {isExpanded && item.children && (
                        <div className="vstack gap-2 mt-2 mb-2 ps-4 pe-2">
                          {item.children.map((sub) => {
                            const isSubActive = activeItem === sub.id;
                            return (
                              <button
                                key={sub.id}
                                type="button"
                                className="btn w-100 text-start py-2 px-3 border-0 d-flex align-items-center justify-content-between"
                                style={{
                                  backgroundColor: 'transparent',
                                  color: isSubActive ? '#00B0FF' : '#E2EDF8',
                                  fontSize: '0.84rem',
                                  fontWeight: isSubActive ? 700 : 400,
                                  borderRadius: '0.4rem',
                                  transition: 'color 0.2s ease, transform 0.15s ease'
                                }}
                                onClick={() => handleSubItemClick(sub.id, item.id)}
                              >
                                <span>{sub.label}</span>
                                {isSubActive && (
                                  <span 
                                    style={{
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      backgroundColor: '#00B0FF',
                                      display: 'inline-block'
                                    }}
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                // Standalone Item (No children)
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="btn w-100 d-flex align-items-center justify-content-between px-3 py-2.5 border-0 text-start text-white text-opacity-90"
                    style={{
                      backgroundColor: isDirectActive ? '#00B0FF' : 'transparent',
                      borderRadius: '0.55rem',
                      fontSize: '0.875rem',
                      fontWeight: isDirectActive ? 600 : 500,
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onClick={() => handleParentClick(item)}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <IconComponent 
                        size={20} 
                        weight={isDirectActive ? 'fill' : 'regular'} 
                        className="flex-shrink-0" 
                      />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
