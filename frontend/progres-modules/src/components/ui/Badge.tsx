import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { Tone } from '@/types/common';

const tones: Record<Tone, { badge: string; dot: string }> = {
  slate: { badge: 'bg-slate-100 text-slate-700 ring-slate-500/15', dot: 'bg-slate-400' },
  blue: { badge: 'bg-blue-50 text-blue-700 ring-blue-600/15', dot: 'bg-blue-500' },
  green: { badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15', dot: 'bg-emerald-500' },
  amber: { badge: 'bg-amber-50 text-amber-800 ring-amber-600/20', dot: 'bg-amber-500' },
  red: { badge: 'bg-rose-50 text-rose-700 ring-rose-600/15', dot: 'bg-rose-500' },
  purple: { badge: 'bg-violet-50 text-violet-700 ring-violet-600/15', dot: 'bg-violet-500' },
  orange: { badge: 'bg-orange-50 text-orange-700 ring-orange-600/15', dot: 'bg-orange-500' },
  cyan: { badge: 'bg-cyan-50 text-cyan-700 ring-cyan-600/15', dot: 'bg-cyan-500' },
  pink: { badge: 'bg-pink-50 text-pink-700 ring-pink-600/15', dot: 'bg-pink-500' },
};

export const toneDot = (tone: Tone) => tones[tone].dot;

export function Badge({ tone = 'slate', dot = false, className, children }: { tone?: Tone; dot?: boolean; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', tones[tone].badge, className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', tones[tone].dot)} />}
      {children}
    </span>
  );
}

/** Same as Badge; alias used for entity statuses so intent is explicit at call sites. */
export const StatusBadge = Badge;
