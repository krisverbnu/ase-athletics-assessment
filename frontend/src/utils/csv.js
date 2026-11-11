// Turn a list of objects into a CSV file and download it (bonus: "data export")
// columns: [{ label: 'Player', value: (row) => row.name }, ...]
export function downloadCsv(filename, rows, columns) {
  const escape = (cell) => {
    const text = cell === null || cell === undefined ? '' : String(cell);
    // Quote cells containing commas, quotes or line breaks; double any quotes inside
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const lines = [
    columns.map((c) => escape(c.label)).join(','),
    ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(',')),
  ];
  // The invisible BOM character at the start makes Excel read accents (é, ñ) correctly
  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
