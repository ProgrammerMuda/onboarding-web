import React from 'react';
import { CaretRight } from '@phosphor-icons/react';

/**
 * Standardized Breadcrumb navigation for Proapps views.
 * Ensures consistent font sizes, spacing, colors (#334155 / #002B7F), and interactive back links.
 * 
 * @param {Object} props
 * @param {Array<{ label: string, onClick?: () => void }>} props.items
 * @param {string} [props.className]
 */
export function Breadcrumb({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  const containerClass = `app-breadcrumb ${className}`.trim();

  return (
    <nav className={containerClass} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <CaretRight size={14} weight="bold" className="app-breadcrumb-sep" />
            )}
            {isLast ? (
              <span className="app-breadcrumb-current">{item.label}</span>
            ) : item.onClick ? (
              <button
                type="button"
                className="app-breadcrumb-link"
                onClick={item.onClick}
              >
                {item.label}
              </button>
            ) : (
              <span className="app-breadcrumb-item">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
