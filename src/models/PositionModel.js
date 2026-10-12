export const POSITION_STORAGE_KEY = 'proapps.hr.positions.v8';
export const TOP_POSITION_ID = 'bm';

export const INITIAL_POSITIONS = [
  { id: 'bm', name: 'Building Manager', parentIds: [] },
];

export function getParentIds(item) {
  if (!item) return [];
  if (Array.isArray(item.parentIds)) return item.parentIds;
  if (item.parentId) return [item.parentId];
  return [];
}

export function descendants(positions, id) {
  const found = new Set();
  const pending = [id];
  while (pending.length) {
    const current = pending.pop();
    for (const position of positions) {
      const pIds = getParentIds(position);
      if (pIds.includes(current) && !found.has(position.id) && position.id !== id) {
        found.add(position.id);
        pending.push(position.id);
      }
    }
  }
  return found;
}

export function ancestors(positions, id) {
  const result = [];
  const seen = new Set([id]);
  const queue = [id];
  while (queue.length) {
    const currentId = queue.shift();
    const current = positions.find((item) => item.id === currentId);
    if (!current) continue;
    const pIds = getParentIds(current);
    for (const pId of pIds) {
      if (!seen.has(pId)) {
        seen.add(pId);
        const parent = positions.find((item) => item.id === pId);
        if (parent) {
          result.push(parent);
          queue.push(pId);
        }
      }
    }
  }
  return result;
}

function validatePositionStructure(draft, positions) {
  if (!draft.name?.trim()) return 'Position name is required.';
  if (draft.name.trim().length > 80) return 'Position name must be 80 characters or fewer.';
  if (positions.some((item) => item.id !== draft.id && item.name.trim().toLocaleLowerCase('id') === draft.name.trim().toLocaleLowerCase('id'))) return 'This position name is already in use.';
  
  const pIds = getParentIds(draft);
  if (pIds.length > 0) {
    if (pIds.includes(draft.id)) return 'A position cannot be its own superior.';
    for (const pId of pIds) {
      if (!positions.some((item) => item.id === pId)) return 'One or more selected superiors could not be found.';
      if (descendants(positions, draft.id).has(pId)) return 'A subordinate cannot become the superior of this position because it would create a circular relationship.';
    }
  }
  return '';
}

function isValidStructure(value) {
  return Array.isArray(value) && new Set(value.map((item) => item?.id)).size === value.length && value.every((item) =>
    item && typeof item.id === 'string' && item.id.length > 0 && typeof item.name === 'string' &&
    !validatePositionStructure(item, value));
}

export function validatePosition(draft, positions) {
  const pIds = getParentIds(draft);
  if (draft.id === TOP_POSITION_ID) {
    if (pIds.length > 0) return 'The top position cannot have any superiors.';
  } else if (pIds.length === 0) {
    return 'Select at least one direct superior. The hierarchy must connect to the organization.';
  }
  return validatePositionStructure(draft, positions);
}

export function isValidPositionData(value) {
  return isValidStructure(value) && value.some((item) => item.id === TOP_POSITION_ID) &&
    value.every((item) => !validatePosition(item, value));
}

export function normalizePositionHierarchy(value) {
  if (!Array.isArray(value)) throw new Error('Invalid position hierarchy');
  const existingRoot = value.find((item) => item.id === TOP_POSITION_ID) ||
    value.find((item) => item.name.trim().toLocaleLowerCase('id') === 'building manager' || item.name.trim().toLocaleLowerCase('id') === 'bm');
  const root = { id: TOP_POSITION_ID, name: existingRoot?.name ?? 'Building Manager', parentIds: [] };
  const positions = [root, ...value.filter((item) => item.id !== existingRoot?.id).map((item) => {
    let pIds = getParentIds(item);
    if (pIds.length === 0) pIds = [TOP_POSITION_ID];
    return {
      ...item,
      parentIds: pIds,
    };
  })];
  if (!isValidPositionData(positions)) throw new Error('Ambiguous position structure');
  return positions;
}

export function validatePositionRemoval(position, positions) {
  if (position.id === TOP_POSITION_ID) return 'The top position cannot be deleted. You can rename it to suit your building.';
  if (positions.some((item) => getParentIds(item).includes(position.id))) return 'Assign all direct subordinates to another superior before deleting this position.';
  return '';
}
