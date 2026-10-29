import React from 'react';
import { Buildings, House, Storefront } from '@phosphor-icons/react';
import { TemplateTypeDialog } from '../components/TemplateTypeDialog';
import { UNIT_CATEGORIES } from '../../models/UnitModel';

const TYPE_ICONS = { hunian: House, non_hunian: Storefront, non_unit: Buildings };

// What each template asks for, so the choice is clear before downloading.
const TYPE_HINTS = {
  hunian: 'Apartments. Includes NPP and number of bedrooms.',
  non_hunian: 'Shops and offices on LG or GF. Includes NPP.',
  non_unit: 'Kiosks, panels, ATMs and other facilities owned by P3SRS. No NPP.'
};

const OPTIONS = UNIT_CATEGORIES.map((c) => ({ id: c.id, label: c.label, hint: TYPE_HINTS[c.id], Icon: TYPE_ICONS[c.id] }));

// Asks which unit type the template is for; the columns differ per type.
export function UnitTemplateDialog({ initialType, onDownload, onCancel }) {
  return (
    <TemplateTypeDialog
      title="Download Template Unit"
      description="Choose the unit type. The template columns follow the Add Unit form for that type."
      legend="Unit type"
      options={OPTIONS}
      initialId={initialType}
      onDownload={onDownload}
      onCancel={onCancel}
    />
  );
}

export default UnitTemplateDialog;
