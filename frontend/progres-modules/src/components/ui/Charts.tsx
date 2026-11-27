import type { ReactNode } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, type TooltipProps } from 'recharts';
import type { LucideIcon } from 'lucide-react';
import { cn, CHART_COLORS } from '@/lib/utils';
import { Card, CardHeader } from './Card';

export { CHART_COLORS };

export function ChartCard({ title, icon, action, children, className, height = 280, subtitle }: { title: ReactNode; icon?: LucideIcon; action?: ReactNode; children: ReactNode; className?: string; height?: number; subtitle?: ReactNode }) {
  return (
    <Card className={cn('animate-slide-up', className)}>
      <CardHeader title={title} icon={icon} action={action} subtitle={subtitle} />
      <div className="px-3 pb-4 pt-3 sm:px-5" style={{ height }} dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {children as any}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/** Shared tooltip styling for every Recharts chart. */
export function ChartTooltip(props: TooltipProps<number, string>) {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-pop">
      {label !== undefined && <p className="mb-1 font-bold text-slate-700">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 text-slate-600">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || (p.payload as any)?.fill }} />
          {p.name}: <span className="font-bold text-slate-800">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export interface DonutDatum {
  name: string;
  value: number;
  color?: string;
}

/** Donut chart with a centre label (like the "Répartition par niveau" card in the design). */
export function DonutChart({ data, centerValue, centerLabel, height = 240, legend = true }: { data: DonutDatum[]; centerValue?: ReactNode; centerLabel?: ReactNode; height?: number; legend?: boolean }) {
  return (
    <div className="relative" style={{ height }} dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="85%" paddingAngle={2} stroke="none" animationDuration={700}>
            {data.map((d, i) => (
              <Cell key={d.name} fill={d.color ?? CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          {legend && <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />}
        </PieChart>
      </ResponsiveContainer>
      {centerValue !== undefined && (
        <div className="pointer-events-none absolute inset-x-0 -translate-y-1/2 text-center" style={{ top: legend ? '40%' : '50%' }}>
          <p className="text-2xl font-extrabold text-navy-900">{centerValue}</p>
          {centerLabel && <p className="text-xs text-slate-500">{centerLabel}</p>}
        </div>
      )}
    </div>
  );
}

export const chartAxis = { tick: { fontSize: 12, fill: '#64748b' }, axisLine: false as const, tickLine: false as const };
export const chartGrid = { stroke: '#e2e8f0', strokeDasharray: '3 3', vertical: false as const };
