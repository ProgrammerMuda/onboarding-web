import React from 'react';
import { MagnifyingGlass, Bell, List } from '@phosphor-icons/react';
import avatarImg from '../../assets/avatar.png';

export function TopNavbar({ onToggleMobileSidebar }) {
  return (
    <header 
      className="bg-white border-bottom d-flex align-items-center justify-content-between px-4 px-lg-5 flex-shrink-0"
      style={{
        height: '68px',
        minHeight: '68px',
        borderColor: '#E2E8F0',
        fontFamily: "'Montserrat', sans-serif",
        zIndex: 900
      }}
    >
      {/* Left Area: Mobile Sidebar Toggle + Search Input */}
      <div className="d-flex align-items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            type="button"
            className="btn btn-light d-lg-none p-2 rounded-2 text-dark border"
            onClick={onToggleMobileSidebar}
            title="Toggle Sidebar"
          >
            <List size={22} weight="bold" />
          </button>
        )}

        {/* Search Input Box */}
        <div className="position-relative" style={{ width: '300px', maxWidth: '100%' }}>
          <div className="input-group">
            <span 
              className="input-group-text bg-white border-end-0 pe-2 text-muted"
              style={{
                borderRadius: '8px 0 0 8px',
                borderColor: '#E2E8F0',
                padding: '0.55rem 0.85rem'
              }}
            >
              <MagnifyingGlass size={17} className="text-secondary opacity-75" />
            </span>
            <input
              type="text"
              className="form-control border-start-0 ps-1 shadow-none"
              placeholder="Search menu..."
              style={{
                borderRadius: '0 8px 8px 0',
                borderColor: '#E2E8F0',
                fontSize: '0.865rem',
                color: '#334155',
                padding: '0.55rem 0.85rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* Right Area: Notification Bell + Divider + User Profile */}
      <div className="d-flex align-items-center gap-4">
        {/* Notification Bell with 99+ Badge */}
        <div 
          className="position-relative cursor-pointer d-flex align-items-center justify-content-center p-1" 
          style={{ cursor: 'pointer' }}
        >
          <Bell size={24} className="text-secondary" weight="regular" />
          <span 
            className="badge bg-danger rounded-pill position-absolute"
            style={{
              fontSize: '0.625rem',
              padding: '0.22em 0.5em',
              top: '-4px',
              right: '-8px',
              fontWeight: 700
            }}
          >
            99+
          </span>
        </div>

        {/* Vertical Divider */}
        <div 
          style={{
            height: '26px',
            width: '1px',
            backgroundColor: '#E2E8F0'
          }} 
          className="d-none d-sm-block"
        />

        {/* User Profile Pill */}
        <div className="d-flex align-items-center gap-3 cursor-pointer" style={{ cursor: 'pointer' }}>
          <span 
            className="d-none d-sm-inline-block fw-semibold"
            style={{ fontSize: '0.875rem', color: '#1E293B', letterSpacing: '-0.01em' }}
          >
            Building Manager
          </span>
          <div 
            className="rounded-circle overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0"
            style={{
              width: '38px',
              height: '38px',
              minWidth: '38px',
              border: '2px solid #E2E8F0'
            }}
          >
            <img
              src={avatarImg}
              alt="Building Manager"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
