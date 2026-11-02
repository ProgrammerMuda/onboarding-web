import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import 'leaflet/dist/leaflet.css';
import {
  CalendarCheck,
  SignIn,
  SignOut,
  Clock,
  Coffee,
  UserMinus,
  FileText,
  MapPin,
  CornersOut,
  CalendarBlank,
  ArrowRight,
  Info,
  Camera,
  QrCode,
  PencilSimple,
  Prohibit,
  IdentificationCard,
  Image as ImageIcon,
  X
} from '@phosphor-icons/react';
import {
  IN_RESULTS,
  OUT_RESULTS,
  GEOFENCE_RADIUS,
  formatLogDate,
  formatPunch,
  formatTotal,
  getPermissionDetails,
  describeInResult,
  describeOutResult
} from '../../models/AttendanceReportModel';
import { DEFAULT_AVATAR, ShiftBadge } from './AttendanceParts';
import './attendance-drawer.css';

const KEY_LABEL = { in: 'Clock In', out: 'Clock Out' };
const METHOD_ICONS = { 'Face Photo': Camera, 'Scan QR': QrCode, 'Manual entry': PencilSimple };

const BUILDING_PIN = `<div class="att-site-pin"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff" viewBox="0 0 256 256"><path d="M240,204H228V96a20,20,0,0,0-20-20H172V32a20,20,0,0,0-28.45-18.12l-104,48.54A20.06,20.06,0,0,0,28,80.55V204H16a12,12,0,0,0,0,24H240a12,12,0,0,0,0-24ZM204,100V204H172V100ZM52,83.09,148,38.3V204H52ZM132,112v12a12,12,0,0,1-24,0V112a12,12,0,0,1,24,0Zm-40,0v12a12,12,0,0,1-24,0V112a12,12,0,0,1,24,0Zm0,52v12a12,12,0,0,1-24,0V164a12,12,0,0,1,24,0Zm40,0v12a12,12,0,0,1-24,0V164a12,12,0,0,1,24,0Z"/></svg></div>`;

const personPin = (key) => `<div class="att-person-pin att-person-pin--${key}"><svg width="44" height="56" viewBox="0 0 44 56" fill="none"><path d="M 22,56 C 10,44 0,32 0,22 C 0,10 10,0 22,0 C 34,0 44,10 44,22 C 44,32 34,44 22,56 Z" stroke-width="2"/><circle cx="22" cy="22" r="15"/></svg><div class="att-person-pin__icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#fff" viewBox="0 0 256 256"><path d="M230.93,220a8,8,0,0,1-6.93,4H32a8,8,0,0,1-6.92-12c15.23-26.33,38.7-45.21,66.09-54.16a72,72,0,1,1,73.66,0c27.39,8.95,50.86,27.83,66.09,54.16A8,8,0,0,1,230.93,220Z"/></svg></div></div>`;

// Tooltip over a pin: an icon for clock in or clock out, the time, and the site.
const tipNode = (key, time, site) => {
  const Icon = key === 'in' ? SignIn : SignOut;
  const node = document.createElement('div');
  node.className = `att-tip att-tip--${key}`;
  const icon = document.createElement('span');
  icon.className = 'att-tip__icon';
  icon.innerHTML = renderToStaticMarkup(<Icon size={16} weight="bold" aria-hidden="true" />);
  const text = document.createElement('div');
  text.className = 'att-tip__text';
  const title = document.createElement('strong');
  title.textContent = KEY_LABEL[key];
  const when = document.createElement('span');
  when.className = 'att-tip__time';
  when.textContent = `${time} WIB`;
  const place = document.createElement('span');
  place.className = 'att-tip__site';
  place.textContent = site;
  text.append(title, when, place);
  node.append(icon, text);
  return node;
};

const siteTipNode = (site) => {
  const node = document.createElement('div');
  node.className = 'att-tip att-tip--site';
  const text = document.createElement('div');
  text.className = 'att-tip__text';
  const title = document.createElement('strong');
  title.textContent = site;
  const radius = document.createElement('span');
  radius.className = 'att-tip__site';
  radius.textContent = `Geofence radius ${GEOFENCE_RADIUS} m`;
  text.append(title, radius);
  node.append(text);
  return node;
};

// Each office shows as a building with its geofence circle, and each tap as a pin where it happened.
// The map opens zoomed out on every site; a location card zooms in on that site and its pin.
function LocationMap({ points }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef({});
  const view = useRef({ focus: () => {}, overview: () => {} });
  const [active, setActive] = useState(null);
  const activeRef = useRef(null);
  activeRef.current = active;

  // Leaflet reads `window` when it loads, so it is imported only once a map is actually drawn.
  useEffect(() => {
    if (!points.length || !mapEl.current) return undefined;
    let cancelled = false;
    let cleanup = () => {};

    import('leaflet').then((mod) => {
      const L = mod.default;
      if (cancelled || !mapEl.current) return;
      const map = L.map(mapEl.current, { zoomControl: false, scrollWheelZoom: false });
      mapRef.current = map;
      markers.current = {};
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      const siteIcon = L.divIcon({ className: 'att-pin-wrap', html: BUILDING_PIN, iconSize: [38, 38], iconAnchor: [19, 19] });
      const drawn = new Set();
      points.forEach((pt) => {
        const key = pt.spot.siteCoords.join(',');
        if (!drawn.has(key)) {
          drawn.add(key);
          L.circle(pt.spot.siteCoords, { radius: GEOFENCE_RADIUS, color: '#09B2FF', fillColor: '#09B2FF', fillOpacity: 0.18, weight: 2.5 }).addTo(map);
          L.marker(pt.spot.siteCoords, { icon: siteIcon, zIndexOffset: 100, title: pt.spot.siteName })
            .addTo(map)
            .bindPopup(siteTipNode(pt.spot.siteName), { className: 'att-popup', closeButton: false, autoPan: false, offset: [0, -14] });
        }
        const icon = L.divIcon({ className: 'att-pin-wrap', html: personPin(pt.key), iconSize: [44, 56], iconAnchor: [22, 56], popupAnchor: [0, -44] });
        markers.current[pt.key] = L.marker(pt.spot.coords, { icon, zIndexOffset: 200, title: `${KEY_LABEL[pt.key]}: ${pt.spot.siteName}` })
          .addTo(map)
          .bindPopup(tipNode(pt.key, pt.time, pt.spot.siteName), { className: 'att-popup', closeButton: false, autoPan: false })
          .on('click', () => setActive(pt.key));
      });

      // The circle around a site, with room for the pin, is the frame for both the overview of one site and a focus.
      const siteBounds = (coords) => L.latLng(coords).toBounds(GEOFENCE_RADIUS * 2.6);
      const overview = (animate) => {
        const bounds = L.latLngBounds([]);
        points.forEach((pt) => bounds.extend(siteBounds(pt.spot.siteCoords)).extend(pt.spot.coords));
        map.fitBounds(bounds, { padding: [24, 24], animate });
      };
      view.current = {
        overview: () => overview(true),
        focus: (pt) => {
          map.flyToBounds(siteBounds(pt.spot.siteCoords).extend(pt.spot.coords), { padding: [24, 24], duration: 0.9 });
        }
      };

      requestAnimationFrame(() => {
        if (cancelled) return;
        map.invalidateSize();
        overview(false);
      });
      const observer = new ResizeObserver(() => {
        map.invalidateSize();
        if (activeRef.current === null) overview(false);
      });
      observer.observe(mapEl.current);
      cleanup = () => {
        observer.disconnect();
        map.remove();
        mapRef.current = null;
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [points]);

  const focusPoint = (pt) => {
    if (!mapRef.current) return;
    setActive(pt.key);
    view.current.focus(pt);
    markers.current[pt.key]?.openPopup();
  };

  const showAll = () => {
    if (!mapRef.current) return;
    setActive(null);
    mapRef.current.closePopup();
    view.current.overview();
  };

  return (
    <>
      <div className="att-map">
        <div ref={mapEl} className="att-map__canvas" role="img" aria-label="Clock in and clock out locations" />
        <button type="button" className="att-map__all" onClick={showAll}>
          <CornersOut size={16} weight="bold" aria-hidden="true" />Show all locations
        </button>
        <div className="att-map__zoom">
          <button type="button" aria-label="Zoom in" onClick={() => mapRef.current?.zoomIn()}>+</button>
          <button type="button" aria-label="Zoom out" onClick={() => mapRef.current?.zoomOut()}>−</button>
        </div>
      </div>
      <div className="att-spots">
        {points.map((pt) => {
          const Icon = pt.key === 'in' ? SignIn : SignOut;
          return (
            <button
              key={pt.key}
              type="button"
              className={`att-spot att-spot--${pt.key}${active === pt.key ? ' is-active' : ''}`}
              aria-pressed={active === pt.key}
              onClick={() => focusPoint(pt)}
            >
              <span className="att-spot__head"><Icon size={16} weight="bold" aria-hidden="true" />Show {KEY_LABEL[pt.key]}</span>
              <span className="att-spot__name">{pt.spot.siteName}</span>
              <span className="att-spot__time">{pt.time} WIB</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function Section({ title, aside, children }) {
  return (
    <section className="att-drawer__section">
      <h4>{title}{aside && <span className="att-drawer__aside">{aside}</span>}</h4>
      {children}
    </section>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="att-drawer__row">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// A punch as the drawer prints it: 24-hour time with WIB, like the location cards.
const clockText = (row, field) => (row[field] ? `${row[field]} WIB` : formatPunch(row, field));

// One step of the day on the timeline: the punch time, its status, and where it happened.
function ClockStep({ kind, row }) {
  const isIn = kind === 'in';
  const result = isIn ? row.inResult : row.outResult;
  const spot = isIn ? row.inSpot : row.outSpot;
  const Icon = isIn ? SignIn : SignOut;
  const note = isIn ? describeInResult(row) : describeOutResult(row);
  const missing = !(isIn ? row.checkIn : row.checkOut);
  return (
    <div className={`att-step att-step--${kind}`}>
      <span className="att-step__node"><Icon size={16} weight="bold" aria-hidden="true" /></span>
      <div className="att-step__card">
        <div className="att-step__head">
          <span className="att-step__label">{KEY_LABEL[kind]}</span>
          <span className={`att-status att-status--${result}`}>{(isIn ? IN_RESULTS : OUT_RESULTS)[result]}</span>
        </div>
        <div className={`att-step__time${missing ? ' is-missing' : ''}`}>{clockText(row, isIn ? 'checkIn' : 'checkOut')}</div>
        {note && <div className="att-step__note">{note}</div>}
        <div className="att-step__place">
          <MapPin size={16} weight="bold" aria-hidden="true" />
          {spot ? (
            <>
              <div className="att-step__where">
                <strong>{spot.siteName}</strong>
                <span>{spot.name}</span>
                <span>{spot.coords.map((c) => c.toFixed(5)).join(', ')}</span>
              </div>
            </>
          ) : (
            <div className="att-step__where">
              <span>{missing ? 'No location recorded' : 'Entered manually, no location recorded'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// The last step of the day: the total time worked.
function TotalStep({ row }) {
  return (
    <div className="att-step att-step--total">
      <span className="att-step__node"><Clock size={16} weight="bold" aria-hidden="true" /></span>
      <div className="att-step__card">
        <div className="att-step__head">
          <span className="att-step__label">Total Work Duration</span>
        </div>
        <div className="att-step__time">{formatTotal(row)}</div>
      </div>
    </div>
  );
}

// One permission: what it is, what it applies to, then the details that belong to its kind.
function PermissionCard({ perm }) {
  return (
    <div className={`att-perm att-perm--${perm.id}`}>
      <div className="att-perm__head">
        <span className="att-perm__icon"><FileText size={18} weight="bold" aria-hidden="true" /></span>
        <span className="att-perm__title">{perm.label}</span>
        <span className="att-perm__scope">{perm.scope}</span>
      </div>

      {perm.hero && (
        <div className="att-perm__hero">
          <strong>{perm.hero.value}</strong>
          <span>{perm.hero.caption}</span>
        </div>
      )}

      {perm.flow && (
        <div className="att-perm__flow">
          <div className="att-perm__shift">
            <span className="att-perm__shift-label">{perm.flow.from.label || 'From'}</span>
            <strong>{perm.flow.from.name}</strong>
            <span>{perm.flow.from.time}</span>
          </div>
          <ArrowRight size={18} weight="bold" aria-hidden="true" />
          <div className="att-perm__shift att-perm__shift--to">
            <span className="att-perm__shift-label">{perm.flow.to.label || 'To'}</span>
            <strong>{perm.flow.to.name}</strong>
            <span>{perm.flow.to.time}</span>
          </div>
        </div>
      )}

      {perm.note && <p className="att-perm__note"><Info size={15} weight="bold" aria-hidden="true" />{perm.note}</p>}

      <dl className="att-perm__rows">
        {perm.rows.map(([label, value]) => (
          <div key={label} className="att-perm__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Evidence({ kind, row }) {
  const isIn = kind === 'in';
  const photo = isIn ? row.checkInPhoto : row.checkOutPhoto;
  const Icon = isIn ? SignIn : SignOut;
  return (
    <figure className="att-detail__shot">
      <span className={`att-tag att-tag--${kind}`}><Icon size={12} weight="bold" aria-hidden="true" />{isIn ? 'In' : 'Out'}</span>
      {photo ? (
        <img src={photo} alt={`${isIn ? 'Check in' : 'Check out'} photo of ${row.name}`} />
      ) : (
        <div className="att-detail__nophoto"><ImageIcon size={32} weight="regular" aria-hidden="true" /><span>No photo</span></div>
      )}
    </figure>
  );
}

export function AttendanceDetailDrawer({ row, onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const alpha = row.inResult === 'alpha';
  const leave = row.remarks.includes('leave_permit');
  const permissions = useMemo(() => getPermissionDetails(row), [row]);
  const points = useMemo(
    () => [
      row.inSpot && { key: 'in', spot: row.inSpot, time: row.checkIn },
      row.outSpot && { key: 'out', spot: row.outSpot, time: row.checkOut }
    ].filter(Boolean),
    [row]
  );
  const shift = row.shiftType;
  const MethodIcon = METHOD_ICONS[row.method] || Prohibit;
  const noMapText = leave ? 'Scheduled day off, no attendance locations' : 'No attendance locations';

  return (
    <div className="emp-filter-drawer-backdrop" onClick={onClose}>
      <aside
        className="emp-filter-drawer att-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="att-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="emp-filter-drawer-header">
          <div className="emp-filter-drawer-title-group">
            <div className="emp-filter-drawer-icon"><CalendarCheck size={18} weight="bold" /></div>
            <div>
              <h3 id="att-drawer-title" className="emp-filter-drawer-title">Attendance Detail</h3>
              <p className="emp-filter-drawer-subtitle">{formatLogDate(row.date)}</p>
            </div>
          </div>
          <button ref={closeRef} type="button" className="emp-filter-drawer-close" onClick={onClose} aria-label="Close">
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="emp-filter-drawer-body att-drawer__body">
          <div className="att-profile">
            <img
              src={row.avatar || DEFAULT_AVATAR}
              alt={row.name}
              className="att-profile__avatar"
              onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
            />
            <div className="att-profile__info">
              <h5 className="att-profile__name">{row.name}</h5>
              <span className="emp-pos-badge">{row.role}</span>
              <span className="att-profile__nip">
                <IdentificationCard size={15} weight="bold" aria-hidden="true" />
                <span>NIP</span>
                <strong>{row.nip}</strong>
              </span>
            </div>
          </div>

          <Section title="Attendance Location Map" aside={points.length > 0 ? 'GPS & Geofencing' : undefined}>
            {points.length > 0 ? (
              <LocationMap points={points} />
            ) : (
              <div className="att-map att-map--empty">
                <MapPin size={28} weight="regular" aria-hidden="true" />
                <span>{noMapText}</span>
              </div>
            )}
          </Section>

          <Section title="Attendance Information">
            <div className="att-info">
              <div className="att-info__shift">
                <span className="att-info__icon"><Clock size={20} weight="bold" aria-hidden="true" /></span>
                <div className="att-info__main">
                  <span className="att-info__label">Work Schedule (Shift)</span>
                  <strong className="att-info__value">{row.shift}</strong>
                  {shift && (
                    <span className="att-info__sub">
                      {shift.checkIn} – {shift.checkOut}{shift.workHours ? ` · ${shift.workHours} hours` : ''}
                    </span>
                  )}
                  {row.changedFromShift && <span className="att-info__sub">Changed from {row.changedFromShift}</span>}
                </div>
                <ShiftBadge shift={shift} />
              </div>
              <div className="att-info__tiles">
                <div className="att-info__tile">
                  <span className="att-info__icon"><CalendarBlank size={20} weight="bold" aria-hidden="true" /></span>
                  <div className="att-info__main">
                    <span className="att-info__label">Date</span>
                    <strong className="att-info__value">{formatLogDate(row.date)}</strong>
                  </div>
                </div>
                <div className="att-info__tile">
                  <span className="att-info__icon"><MethodIcon size={20} weight="bold" aria-hidden="true" /></span>
                  <div className="att-info__main">
                    <span className="att-info__label">Attendance Method</span>
                    <strong className="att-info__value">{row.method || 'No method'}</strong>
                    {row.remarks.includes('manual') && <span className="att-info__sub">Clock out entered manually</span>}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Attendance Result">
            {alpha && (
              <div className="att-banner att-banner--alpha">
                <UserMinus size={20} weight="bold" aria-hidden="true" />
                <div>
                  <strong>Absent Without Notice (Alpha)</strong>
                  <span>No clock-in or clock-out record found in the system.</span>
                </div>
              </div>
            )}
            {leave && (
              <div className="att-banner att-banner--leave">
                <Coffee size={20} weight="bold" aria-hidden="true" />
                <div>
                  <strong>Leave Permit</strong>
                  <span>No attendance is required on this day.</span>
                </div>
              </div>
            )}
            <div className="att-steps">
              {!alpha && !leave && <ClockStep kind="in" row={row} />}
              {!alpha && !leave && <ClockStep kind="out" row={row} />}
              <TotalStep row={row} />
            </div>
          </Section>

          {permissions.length > 0 && (
            <Section title="Permission">
              <div className="att-perms">
                {permissions.map((perm) => <PermissionCard key={perm.id} perm={perm} />)}
              </div>
            </Section>
          )}

          <Section title="Attendance Evidence">
            <div className="att-detail__shots">
              <Evidence kind="in" row={row} />
              <Evidence kind="out" row={row} />
            </div>
          </Section>
        </div>
      </aside>
    </div>
  );
}
