import { ProjectThumb } from './Badges';
import type { ProjectListItem } from '../types';

export function ProjectCell({ p }: { p: Pick<ProjectListItem, 'id' | 'title' | 'reference' | 'location'> }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <ProjectThumb seed={p.id} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-navy-900">{p.title}</p>
        <p className="truncate text-xs text-slate-500"><span className="ltr-text font-mono">{p.reference}</span> · {p.location}</p>
      </div>
    </div>
  );
}
