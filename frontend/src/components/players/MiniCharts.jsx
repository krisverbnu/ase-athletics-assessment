// Two small charts for the player profile: market value over time and goals/assists per month.
// Colours from the guidelines' chart palette.
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS, AXIS_LINE, GRID, LEGEND, LINE_CURSOR, TOOLTIP } from '../../utils/chartTheme';
import { formatMoney, SERIES_COLORS } from '../../utils/format';

const monthLabel = (d) => new Date(d).toLocaleDateString('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' });

// Dates sit on a real time scale, so 6 months looks shorter than a year
export function ValueHistoryChart({ history }) {
  const data = history.map((h) => ({ time: new Date(h.date).getTime(), value: h.value }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
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
            formatter={(v) => [formatMoney(v), 'Market value']}
            labelFormatter={(t) =>
              new Date(t).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                timeZone: 'UTC',
              })
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={SERIES_COLORS[0]}
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyFormChart({ form }) {
  const data = form.map((m) => ({ month: monthLabel(m.month), Goals: m.goals, Assists: m.assists }));
  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="month" tick={AXIS} tickLine={false} axisLine={AXIS_LINE} />
          <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} width={32} />
          <Tooltip {...TOOLTIP} />
          <Legend {...LEGEND} />
          <Bar dataKey="Goals" fill={SERIES_COLORS[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
          <Bar dataKey="Assists" fill={SERIES_COLORS[1]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
