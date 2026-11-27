import { useState } from 'react';
import { useI18n } from '@/i18n';
import { ConfirmDialog, useToast } from '@/components/ui';
import { renovationService } from '@/services/renovation.service';
import { getErrorMessage } from '@/services/http';
import { ProjectStatusBadge } from './Badges';
import type { ProjectDetail, ProjectStatus } from '../types';

/** Status change is confirmed + commented; the list of targets is supplied by the API (`allowedStatuses`). */
export function StatusDialog({ project, target, onClose, onDone }: { project: ProjectDetail; target: ProjectStatus | null; onClose: () => void; onDone: (p: ProjectDetail) => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  if (!target) return null;
  const needsComment = target === 'paused' || target === 'cancelled';
  return (
    <ConfirmDialog
      open
      onClose={onClose}
      loading={loading}
      tone={target === 'cancelled' ? 'danger' : target === 'paused' ? 'warning' : target === 'completed' ? 'success' : 'primary'}
      title={t('ren.status.confirmTitle', { status: t(`ren.status.${target}`) })}
      message={t('ren.status.confirmMsg')}
      commentLabel={t('ren.status.comment')}
      commentRequired={needsComment}
      minCommentLength={needsComment ? 5 : undefined}
      onConfirm={async (comment) => {
        setLoading(true);
        try {
          const p = await renovationService.updateStatus(project.id, target, comment?.trim() || undefined);
          toast.success(t('ren.status.updated'));
          onDone(p);
          onClose();
        } catch (e) {
          toast.error(getErrorMessage(e));
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="flex items-center justify-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
        <ProjectStatusBadge status={project.status} /> <span className="text-slate-400 rtl:rotate-180">→</span> <ProjectStatusBadge status={target} />
      </div>
    </ConfirmDialog>
  );
}
