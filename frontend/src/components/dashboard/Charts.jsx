// The dashboard charts. Each takes the numbers it needs from /api/dashboard/stats.
// Style rules (from ASE's guidelines + chart best practice):
//   one y-axis per chart, light grid, axis text slate-500, thin marks with rounded ends,
//   a legend whenever there's more than one series, and a tooltip on hover.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { buildTrendRows } from '../../utils/chartData';
import { AXIS, AXIS_LINE, GRID, LEGEND, LINE_CURSOR, TOOLTIP } from '../../utils/chartTheme';
import { formatMoney, POSITION_COLORS, SERIES_COLORS } from '../../utils/format';

// 1. Goals and assists by position: grouped bars, one axis (both are counts)
export function GoalsByPositionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={2} barCategoryGap="28%">
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="position" interval={0} tick={AXIS} tickLine={false} axisLine={AXIS_LINE} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip {...TOOLTIP} />
        <Legend {...LEGEND} />
        <Bar isAnimationActive={false} dataKey="goals" name="Goals" fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} />
        <Bar isAnimationActive={false} dataKey="assists" name="Assists" fill={SERIES_COLORS[1]} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 2. Age groups: a donut. Ages are ordered (young -> old), so one hue from light to dark,
//    not four unrelated colours. White gaps separate the slices.
const AGE_SHADES = ['#bae6fd', '#38bdf8', '#0284c7', '#075985'];

export function AgeGroupsChart({ data }) {
  const total = data.reduce((n, d) => n + d.players, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="players"
              nameKey="label"
              innerRadius="62%"
              outerRadius="100%"
              stroke="#ffffff"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d, i) => (
                <Cell key={d.label} fill={AGE_SHADES[i]} />
              ))}
            </Pie>
            <Tooltip {...TOOLTIP} formatter={(v) => [`${v} players`, 'Players']} />
          </PieChart>
        </ResponsiveContainer>
        {/* The total sits in the hole of the donut */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-secondary-900">{total}</span>
          <span className="text-xs text-secondary-500">players</span>
        </div>
      </div>
      {/* Legend with the exact numbers, so the chart never relies on colour alone */}
      <ul className="flex w-full flex-col gap-2">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-secondary-700">
              <span className="size-3 rounded-full" style={{ background: AGE_SHADES[i] }} aria-hidden />
              {d.label}
            </span>
            <span className="tabular-nums text-secondary-900">
              {d.players}{' '}
              <span className="text-secondary-500">({total ? Math.round((d.players / total) * 100) : 0}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 3. Market value over time for the most valuable players.
//    Dates sit on a real time axis; each player's dates differ, so rows are merged by date
//    and lines join across gaps (connectNulls).
const monthLabel = (t) => new Date(t).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

export function ValueTrendsChart({ trends }) {
  const rows = buildTrendRows(trends);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis
          dataKey="time"
          type="number"
          scale="time"
          domain={['dataMin', 'dataMax']}
          tickFormatter={monthLabel}
          tick={AXIS}
          tickLine={false}
          axisLine={AXIS_LINE}
        />
        <YAxis tickFormatter={formatMoney} tick={AXIS} tickLine={false} axisLine={false} width={56} />
        <Tooltip
          {...TOOLTIP}
          cursor={LINE_CURSOR}
          formatter={(v, name) => [formatMoney(v), name]}
          labelFormatter={(t) =>
            new Date(t).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              timeZone: 'UTC',
            })
          }
        />
        <Legend {...LEGEND} />
        {trends.map((player, i) => (
          <Line
            isAnimationActive={false}
            key={player.id}
            type="monotone"
            dataKey={player.name}
            stroke={SERIES_COLORS[i]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// 4. Average attributes by position: a radar, one outline per position
const ATTRS = ['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'];

export function AttributesRadar({ data }) {
  // Reshape: one row per attribute, one column per position
  const rows = ATTRS.map((attr) => ({
    attribute: attr.charAt(0).toUpperCase() + attr.slice(1),
    ...Object.fromEntries(data.filter((d) => d[attr]).map((d) => [d.position, d[attr]])),
  }));
  const positions = data.filter((d) => d.pace).map((d) => d.position);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="attribute" tick={{ ...AXIS, fill: '#475569' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip {...TOOLTIP} />
        <Legend {...LEGEND} />
        {positions.map((position) => (
          <Radar
            isAnimationActive={false}
            key={position}
            name={position}
            dataKey={position}
            stroke={POSITION_COLORS[position]}
            fill={POSITION_COLORS[position]}
            fillOpacity={0.08}
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

// 5. Players per team: horizontal bars (long team names read better sideways), top 10
export function TeamsChart({ data }) {
  const rows = data.slice(0, 10);
  return (
    <ResponsiveContainer width="100%" height={Math.max(160, rows.length * 32)}>
      <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 24, left: 8, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="team"
          width={140}
          tick={{ ...AXIS, fill: '#475569' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip {...TOOLTIP} formatter={(v) => [v, 'Players']} />
        <Bar isAnimationActive={false} dataKey="players" fill={SERIES_COLORS[0]} radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
