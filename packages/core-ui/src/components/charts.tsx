import {
  Bar,
  CartesianGrid,
  Line,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface SeriesConfig {
  key: string;
  label: string;
  color?: string;
}

export interface ChartProps {
  // biome-ignore lint/suspicious/noExplicitAny: recharts' own data prop is an untyped array of plain objects
  data: Record<string, any>[];
  xKey: string;
  series: SeriesConfig[];
  height?: number;
}

const DEFAULT_COLORS = [
  'var(--chart-1, #2563eb)',
  'var(--chart-2, #16a34a)',
  'var(--chart-3, #d97706)',
  'var(--chart-4, #dc2626)',
  'var(--chart-5, #7c3aed)',
];

/**
 * Thin recharts wrapper: every app chart (cash curve, job cost, draw
 * progress) goes through this instead of configuring `ResponsiveContainer` +
 * axes + tooltip from scratch each time, so chart look-and-feel stays
 * consistent. Not a general-purpose charting API — apps needing bespoke
 * chart behavior use recharts directly.
 */
export function LineChart({ data, xKey, series, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export function BarChart({ data, xKey, series, height = 300 }: ChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey={xKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
