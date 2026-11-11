// Charts for the comparison page. Each player keeps the same colour on every tab,
// based on the order they were added (colour follows the player, never their rank).
import {
  CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { mergeSeries } from '../../utils/chartData';
import { CORE_ATTRIBUTES } from '../../utils/format';

const AXIS = { fill: '#6b7280', fontSize: 12 };
const TOOLTIP = { contentStyle: { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 13 } };
const LEGEND = { wrapperStyle: { fontSize: 13, paddingTop: 8 }, iconType: 'circle', iconSize: 10 };
const monthLabel = (t) => new Date(t).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });
const fullDate = (t) => new Date(t).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });


// Radar: each player's six core attributes overlaid
export function AttributeRadar({ players }) {
  const rows = CORE_ATTRIBUTES.map((attr) => ({
    attribute: attr.charAt(0).toUpperCase() + attr.slice(1),
    ...Object.fromEntries(players.map((p) => [p.name, p.attributes?.[attr] ?? 0])),
  }));
  return (
    <ResponsiveContainer width="100%" height={360}>
      <RadarChart data={rows} outerRadius="72%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="attribute" tick={{ ...AXIS, fill: '#475569' }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip {...TOOLTIP} />
        <Legend {...LEGEND} />
        {players.map((p) => (
          <Radar key={p.id} name={p.name} dataKey={p.name} stroke={p.color} fill={p.color} fillOpacity={0.08}
            strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
        ))}
      </RadarChart>
    </ResponsiveContainer>
  );
}

// One line per player over time. series = [{ id, name, color, points: [{ time, value }] }]
export function TimeLines({ series, valueFormat = (v) => v, valueLabel }) {
  const rows = mergeSeries(series);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#f3f4f6" vertical={false} />
        <XAxis dataKey="time" type="number" scale="time" domain={['dataMin', 'dataMax']} tickFormatter={monthLabel}
          tick={AXIS} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
        <YAxis tickFormatter={valueFormat} tick={AXIS} tickLine={false} axisLine={false} width={56} allowDecimals={false} />
        <Tooltip {...TOOLTIP} cursor={{ stroke: '#cbd5e1' }} labelFormatter={fullDate}
          formatter={(v, name) => [valueFormat(v), valueLabel ? `${name} (${valueLabel})` : name]} />
        <Legend {...LEGEND} />
        {series.map((s) => (
          <Line key={s.id} type="monotone" dataKey={s.name} stroke={s.color} strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

