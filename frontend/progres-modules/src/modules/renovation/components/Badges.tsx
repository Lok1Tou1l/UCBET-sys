import { useI18n } from '@/i18n';
import { Badge } from '@/components/ui';
import type { Tone } from '@/types/common';
import type { ContractorStatus, DocumentCategory, ProjectPhase, ProjectStatus } from '../types';

export const projectTone: Record<ProjectStatus, Tone> = { planned: 'blue', active: 'amber', paused: 'orange', completed: 'green', cancelled: 'red' };
const contractorTone: Record<ContractorStatus, Tone> = { active: 'green', inactive: 'slate', suspended: 'red' };
const phaseTone: Record<ProjectPhase, Tone> = { preparation: 'slate', structural: 'purple', finishing: 'cyan', equipment: 'blue', inspection: 'amber', handover: 'green' };
const catTone: Record<DocumentCategory, Tone> = { plan: 'blue', contract: 'purple', report: 'amber', photo: 'cyan', permit: 'green', other: 'slate' };

export const ProjectStatusBadge = ({ status }: { status: ProjectStatus }) => {
  const { t } = useI18n();
  return <Badge tone={projectTone[status]}>{t(`ren.status.${status}`)}</Badge>;
};
export const PhaseBadge = ({ phase }: { phase: ProjectPhase }) => {
  const { t } = useI18n();
  return <Badge tone={phaseTone[phase]} dot={false}>{t(`ren.phase.${phase}`)}</Badge>;
};
export const ContractorStatusBadge = ({ status }: { status: ContractorStatus }) => {
  const { t } = useI18n();
  return <Badge tone={contractorTone[status]}>{t(`ren.cstatus.${status}`)}</Badge>;
};
export const CategoryBadge = ({ category }: { category: DocumentCategory }) => {
  const { t } = useI18n();
  return <Badge tone={catTone[category]} dot={false}>{t(`ren.doccat.${category}`)}</Badge>;
};

const palettes = [
  ['#dbeafe', '#93c5fd', '#2563eb'], ['#ede9fe', '#c4b5fd', '#7c3aed'], ['#dcfce7', '#86efac', '#16a34a'], ['#ffedd5', '#fdba74', '#ea6c0a'], ['#cffafe', '#67e8f9', '#0891b2'],
];
/** small generated building illustration used as a project thumbnail (no external images) */
export function ProjectThumb({ seed, size = 44, className = '' }: { seed: string; size?: number; className?: string }) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const [bg, mid, fg] = palettes[h % palettes.length];
  const floors = 3 + (h % 3);
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={`shrink-0 rounded-xl ${className}`} aria-hidden>
      <rect width="48" height="48" fill={bg} />
      <rect x="0" y="40" width="48" height="8" fill={mid} opacity=".6" />
      <rect x="10" y={40 - floors * 6} width="22" height={floors * 6} rx="1.5" fill={fg} />
      <rect x="32" y={40 - (floors - 1) * 5} width="8" height={(floors - 1) * 5} rx="1" fill={mid} />
      {Array.from({ length: floors }).map((_, r) => [0, 1, 2].map((c) => <rect key={`${r}${c}`} x={13 + c * 6.5} y={43 - floors * 6 + r * 6 - 1 + 1} width="3.5" height="3" rx=".6" fill="#fff" opacity=".85" />))}
      <path d="M36 12l4 -4 4 4" stroke={fg} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}
