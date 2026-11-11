// Market value histories come per player, each with its own dates.
// A line chart needs one row per date, so this merges them:
// [{ time, 'Player A': 65000000, 'Player B': 45000000 }, ...]
export function buildTrendRows(trends) {
  const byTime = new Map();
  for (const player of trends) {
    for (const point of player.history) {
      const time = new Date(point.date).getTime();
      byTime.set(time, { ...(byTime.get(time) || { time }), [player.name]: point.value });
    }
  }
  return [...byTime.values()].sort((a, b) => a.time - b.time);
}
