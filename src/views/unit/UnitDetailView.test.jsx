import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { UnitDetailView } from './UnitDetailView';
import { SEED_UNITS, buildUnit, getEmptyDraft } from '../../models/UnitModel';

const render = (unit) => renderToString(<UnitDetailView unit={unit} onBack={() => {}} />);
const seed = (predicate) => SEED_UNITS.find(predicate);
const filledUnit = (patch = {}, category = 'hunian') =>
  buildUnit({
    ...getEmptyDraft(category), tower: 'Tower A', floor: '03', code: 'Z0301', area: '36.5',
    electricCapacity: '2200', waterMeterNo: '20240101', electricMeterNo: '31240101',
    waterMeterStart: '5', electricMeterStart: '10', npp: '0.25', bedrooms: '2', iplInterval: '3', ...patch
  });

describe('UnitDetailView', () => {
  it('keeps the shared header and is a full page', () => {
    const html = render(seed((u) => u.category === 'hunian'));
    expect(html).toContain('Detail Unit');
    expect(html).toContain('emp-hero-banner');
    expect(html).toContain('Back to List Unit');
    expect(html).not.toContain('role="dialog"');
  });

  it('has Unit Info, Owner & Occupant, Bill Settings, and Meters cards', () => {
    const html = render(seed((u) => u.category === 'hunian'));
    ['Unit Info', 'Owner &amp; Occupant', 'Bill Settings', 'Meters'].forEach((t) => expect(html).toContain(t));
  });

  it('shows the owner first, then the occupant, for an occupied unit', () => {
    const unit = seed((u) => u.category === 'hunian' && u.status === 'occupied' && !u.occupant);
    const html = render(unit);
    expect(html.indexOf('>Owner<')).toBeGreaterThan(-1);
    expect(html.indexOf('>Owner<')).toBeLessThan(html.indexOf('>Occupant<'));
    expect(html).toContain(unit.ownerName);
    expect(html).not.toContain('>Renter<');
  });

  it('shows the renter as the Occupant, with Renter underneath the name', () => {
    const unit = seed((u) => u.category === 'hunian' && u.status === 'rented');
    const html = render(unit);
    expect(html).toContain('>Occupant<');
    expect(html).toContain(unit.tenantName);
    expect(html).toContain('>Renter<');
    expect(html).toContain(unit.ownerName);
    expect(html).not.toContain('Lives in the unit');
    // label, then name, then the Renter caption underneath
    const tile = html.slice(html.indexOf('>Occupant<'));
    expect(tile.indexOf(unit.tenantName)).toBeLessThan(tile.indexOf('>Renter<'));
  });

  it('names the proxy and says Proxy', () => {
    const unit = seed((u) => u.occupant);
    const html = render(unit);
    expect(html).toContain(unit.occupant.name);
    expect(html).toContain('>Proxy<');
  });

  it('shows nobody and Available for a vacant unit', () => {
    const html = render(seed((u) => u.category === 'hunian' && u.status === 'vacant'));
    expect(html).toContain('No one yet');
    expect(html).toContain('Available');
  });

  it('lists the same fields as the Add form, blank as a dash, for sample units', () => {
    const html = render(seed((u) => u.category === 'hunian' && !u.detail));
    ['Unit area', 'NPP', 'Bedrooms', 'Electric bill', 'Water bill', 'IPL bill', 'IPL bill interval',
      'Meter no', 'Capacity', 'Initial meter'].forEach((label) => expect(html).toContain(label));
    expect(html).toContain('Not set');
    expect(html).toContain('<span class="unit-muted">-</span>');
  });

  it('shows the saved detail of a unit added through the form', () => {
    const html = render(filledUnit());
    ['2200 VA', '20240101', '31240101', '5 m³', '10 kWh', 'Every 3 months'].forEach((v) => expect(html).toContain(v));
    ['<strong>36.5</strong><small>m²</small>', '<strong>0.25</strong>', '<strong>2</strong><small>bedrooms</small>']
      .forEach((v) => expect(html).toContain(v));
    expect(html).toContain('Active');
    expect(html).not.toContain('Not set');
  });

  it('shows Inactive bills and No IPL when they are switched off', () => {
    const html = render(filledUnit({ invoiceWater: 'no', invoiceIpl: 'no', iplInterval: '' }));
    expect(html).toContain('Inactive');
    expect(html).toContain('No IPL');
  });

  it('skips NPP, IPL, and bedrooms for a Non-Unit', () => {
    const html = render(seed((u) => u.category === 'non_unit' && u.status === 'rented'));
    expect(html).not.toContain('NPP');
    expect(html).not.toContain('IPL');
    expect(html).not.toContain('Bedrooms');
    expect(html).toContain('P3SRS');
    expect(html).toContain('>Renter<');
  });
});

describe('UnitDetailView for the fully filled sample unit A0101', () => {
  it('shows every field with a value and no blanks', () => {
    const html = render(SEED_UNITS.find((u) => u.code === 'A0101'));
    ['2200 VA', '1480 kWh', '12.5 m³', '31240101', '20240101', 'Every 1 month'].forEach((v) => expect(html).toContain(v));
    ['<strong>45.5</strong><small>m²</small>', '<strong>0.25</strong>', '<strong>2</strong><small>bedrooms</small>']
      .forEach((v) => expect(html).toContain(v));
    expect(html).toContain('>Renter<');
    expect(html).not.toContain('Not set');
    expect(html).not.toContain('<span class="unit-muted">-</span>');
    expect((html.match(/>Active</g) || []).length).toBe(3);
  });
});

describe('UnitDetailView identity tiles', () => {
  it('shows unit name, type, tower, and floor as the same tiles as the specs', () => {
    const html = render(filledUnit());
    expect(html).toContain('unit-specs unit-specs--identity');
    expect(html).not.toContain('unit-strip');
    expect(html).not.toContain('unit-id__icon');
    expect((html.match(/class="unit-spec"/g) || []).length).toBe(7);
    ['Unit name', 'Unit type', 'Tower', 'Floor', 'Z0301', 'Residential Unit', 'Tower A', 'Floor 03']
      .forEach((v) => expect(html).toContain(v));
  });

  it('uses the singular for one bedroom and a dash for a missing area', () => {
    expect(render(filledUnit({ bedrooms: '1' }))).toContain('<strong>1</strong><small>bedroom</small>');
    const blank = render(SEED_UNITS.find((u) => u.category === 'hunian' && !u.detail));
    expect(blank).toContain('<span class="unit-muted">-</span>');
  });
});

describe('UnitDetailView bill settings', () => {
  const rows = (html) => (html.match(/class="unit-d-setting"/g) || []).length;

  it('lists Electric bill, Water bill, IPL bill, then IPL bill interval, one per row', () => {
    const html = render(SEED_UNITS.find((u) => u.code === 'A0101'));
    const list = html.slice(html.indexOf('unit-d-settings'));
    const order = ['>Electric bill<', '>Water bill<', '>IPL bill<', '>IPL bill interval<', 'Every 1 month'].map((v) => list.indexOf(v));
    order.forEach((i) => expect(i).toBeGreaterThan(-1));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(rows(html)).toBe(4);
    expect((html.match(/unit-d-switch--active/g) || []).length).toBe(3);
  });

  it('explains each state in words, not only with the switch', () => {
    const on = render(filledUnit());
    expect(on).toContain('Added to the invoice');
    expect(on).toContain('How often IPL is billed');
    const off = render(filledUnit({ invoiceWater: 'no', invoiceIpl: 'no', iplInterval: '' }));
    expect(off).toContain('Inactive');
    expect(off).toContain('Not added to the invoice');
    expect(off).toContain('IPL is not on the invoice');
    expect(off).toContain('No IPL');
    const blank = render(SEED_UNITS.find((u) => u.category === 'hunian' && !u.detail));
    expect(blank).toContain('Not set');
    expect(blank).toContain('Not set up yet');
  });

  it('shows only Electric and Water for a Non-Unit', () => {
    const html = render(SEED_UNITS.find((u) => u.category === 'non_unit'));
    expect(rows(html)).toBe(2);
    expect(html).not.toContain('IPL bill');
  });
});

describe('UnitDetailView meters', () => {
  it('gives each meter its own block with the meter number first, then the supporting numbers', () => {
    const html = render(SEED_UNITS.find((u) => u.code === 'A0101'));
    expect((html.match(/class="unit-d-meter unit-d-meter--/g) || []).length).toBe(2);
    const electric = html.slice(html.indexOf('unit-d-meter--electric'), html.indexOf('unit-d-meter--water'));
    const order = ['Electricity', 'Meter no', '31240101', 'Capacity', '2200 VA', 'Initial meter', '1480 kWh'].map((v) => electric.indexOf(v));
    order.forEach((i) => expect(i).toBeGreaterThan(-1));
    expect(order).toEqual([...order].sort((a, b) => a - b));
    const water = html.slice(html.indexOf('unit-d-meter--water'));
    expect(water).toContain('20240101');
    expect(water).toContain('12.5 m³');
    expect(water).not.toContain('Capacity');
  });

  it('shows a dash for a meter that was never filled', () => {
    const blank = render(SEED_UNITS.find((u) => u.category === 'hunian' && !u.detail));
    const meters = blank.slice(blank.indexOf('unit-d-meters'));
    expect((meters.match(/<span class="unit-muted">-<\/span>/g) || []).length).toBe(5);
  });
});
