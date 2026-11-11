// One look for every chart in the app (dashboard, compare, player profile).
// Colours and shadows come from ASE's guidelines (data/ui_guidelines.json).

export const AXIS = { fill: '#64748b', fontSize: 12 };
export const AXIS_LINE = { stroke: '#e2e8f0' };
export const GRID = '#f1f5f9';

// Tooltip: white card with the guidelines' "md" shadow, bold heading, aligned values
export const TOOLTIP = {
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    padding: '8px 12px',
    fontSize: 13,
  },
  labelStyle: { color: '#0f172a', fontWeight: 600, marginBottom: 4 },
  // Text stays dark and readable; the colour belongs to the marks, not the words
  itemStyle: { padding: '1px 0', color: '#334155' },
  // Keep series in drawing order (Recharts sorts by name by default)
  itemSorter: () => 0,
  cursor: { fill: '#f8fafc' },
};
export const LINE_CURSOR = { stroke: '#cbd5e1', strokeDasharray: '3 3' };

// Legend: keep series in the order they're drawn. Recharts sorts alphabetically by
// default, which put "Assists" before "Goals" even though the Goals bar comes first.
export const LEGEND = { wrapperStyle: { fontSize: 13, paddingTop: 8 }, iconType: 'circle', iconSize: 10, itemSorter: null };
