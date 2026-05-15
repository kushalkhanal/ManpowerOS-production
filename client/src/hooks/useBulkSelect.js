import { useState, useCallback } from 'react';

/**
 * Manages checkbox selection state for a list of items.
 * Items must have a string-serialisable `_id` field.
 */
export function useBulkSelect() {
  const [selected, setSelected] = useState(new Set());

  const toggle = useCallback((id) => {
    setSelected(prev => {
      const next = new Set(prev);
      const key = id?.toString();
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const selectAll = useCallback((items) => {
    setSelected(new Set(items.map(i => i._id?.toString())));
  }, []);

  const clearAll = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((id) => selected.has(id?.toString()), [selected]);

  return {
    selected,
    selectedIds: Array.from(selected),
    count: selected.size,
    toggle,
    selectAll,
    clearAll,
    isSelected
  };
}

export default useBulkSelect;
