import type { ReactNode } from 'react';
import { cn } from '../cn.js';
import { Card, CardContent, CardHeader, CardTitle } from './card.js';

export interface StatCardProps {
  label: string;
  value: string | number;
  /** e.g. "+4.2% vs last month" — sign drives the color (green for `+`, red for `-`). */
  delta?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, delta, icon, className }: StatCardProps) {
  const deltaSign = delta?.trim().startsWith('-') ? 'negative' : 'positive';

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta ? (
          <p
            className={cn(
              'text-xs',
              deltaSign === 'negative' ? 'text-destructive' : 'text-emerald-600',
            )}
          >
            {delta}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
