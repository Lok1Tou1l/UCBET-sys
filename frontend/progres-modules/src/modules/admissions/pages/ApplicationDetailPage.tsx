import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, FileCheck2, FileText, GraduationCap, History, User } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth/AuthContext';
import { useAsync } from '@/hooks/useAsync';
import { admissionsService } from '@/services/admissions.service';
import { Card, CardBody, CardHeader, DescriptionList, DocumentPreview, ErrorState, PageHeader, PageSkeleton, ProgressBar, Timeline, type PreviewableDoc } from '@/components/ui';
import { ApplicationStatusBadge } from '../components/Badges';
import { DocumentReviewDialog, DocumentRow } from '../components/DocumentReview';
import { DecisionActions } from '../components/DecisionActions';
import type { ApplicationDetail, ApplicationDocument } from '../types';

const eventTone = { submitted: 'blue', review_started: 'amber', accepted: 'green', rejected: 'red', correction_requested: 'blue', resubmitted: 'purple', document_reviewed: 'slate' } as const;

export default function ApplicationDetailPage() {
  const { id = '' } = useParams();
  const { t, loc, formatDate, formatDateTime } = useI18n();
  const { can } = useAuth();
  const { data, error, reload, setData } = useAsync(() => admissionsService.getApplication(id), [id], { keepPrevious: false });
  const [preview, setPreview] = useState<PreviewableDoc | null>(null);
  const [reviewDoc, setReviewDoc] = useState<ApplicationDocument | null>(null);

  const crumbs = [{ label: t('adm.title'), to: '/admissions' }, { label: t('adm.queue.title'), to: '/admissions/applications' }];
  if (error && !data) return (<><PageHeader title={t('adm.detail.title')} breadcrumbs={crumbs} /><ErrorState error={error} onRetry={reload} /></>);
  if (!data) return <PageSkeleton />;

  const a: ApplicationDetail = data;
  const canDecide = can('admissions.decide');
  const reviewable = canDecide && (a.status === 'under_review' || a.status === 'submitted');
  const problems = a.documents.filter((d) => ['missing', 'invalid', 'incomplete'].includes(d.status)).length;
  const pct = a.completion.required ? (a.completion.verified / a.completion.required) * 100 : 0;

  const onDocUpdated = (d: ApplicationDocument) =>
    setData((prev) => {
      if (!prev) return prev;
      const documents = prev.documents.map((x) => (x.id === d.id ? d : x));
      return { ...prev, documents, completion: { ...prev.completion, verified: documents.filter((x) => x.status === 'valid').length } };
    });

  return (
    <>
      <PageHeader
        breadcrumbs={[...crumbs, { label: a.reference }]}
        title={a.studentName}
        badge={<ApplicationStatusBadge status={a.status} />}
        subtitle={<span><span className="ltr-text font-mono">{a.reference}</span> · {loc(a.programName, a.programNameAr)} ({a.level}) · {a.academicYear}</span>}
        actions={<Link to="/admissions/applications" className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('action.back')}</Link>}
      />

      {a.decisionComment && (a.status === 'rejected' || a.status === 'needs_correction') && (
        <div className={`mb-6 flex gap-3 rounded-2xl border p-4 ${a.status === 'rejected' ? 'border-rose-200 bg-rose-50' : 'border-sky-200 bg-sky-50'}`}>
          <AlertTriangle className={`mt-0.5 h-5 w-5 shrink-0 ${a.status === 'rejected' ? 'text-rose-600' : 'text-sky-600'}`} />
          <div>
            <p className="text-sm font-bold text-slate-800">{t(`adm.decisionComment.${a.status}`)}</p>
            <p className="mt-0.5 text-sm text-slate-700">{a.decisionComment}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader title={t('adm.section.student')} icon={User} />
            <CardBody>
              <DescriptionList columns={3} items={[
                { label: t('adm.field.fullName'), value: a.studentName },
                { label: t('common.studentId'), value: <span className="ltr-text font-mono">{a.studentId}</span> },
                { label: t('adm.field.sex'), value: a.student.sex === 'M' ? t('adm.field.sexM') : t('adm.field.sexF') },
                { label: t('adm.field.birthDate'), value: formatDate(a.student.birthDate) },
                { label: t('adm.field.birthPlace'), value: a.student.birthPlace },
                { label: t('adm.field.nationality'), value: a.student.nationality },
                { label: t('common.email'), value: <span className="ltr-text">{a.email}</span> },
                { label: t('common.phone'), value: <span className="ltr-text">{a.student.phone}</span> },
                { label: t('common.address'), value: a.student.address },
              ]} />
            </CardBody>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title={t('adm.section.application')} icon={FileText} />
              <CardBody>
                <DescriptionList columns={1} items={[
                  { label: t('adm.field.requestedProgram'), value: `${loc(a.programName, a.programNameAr)} (${a.level})` },
                  { label: t('common.specialty'), value: loc(a.specialty, a.specialtyAr) },
                  { label: t('common.academicYear'), value: <span className="ltr-text">{a.academicYear}</span> },
                  { label: t('adm.field.choiceRank'), value: `#${a.academic.choiceRank}` },
                ]} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t('adm.section.academic')} icon={GraduationCap} />
              <CardBody>
                <DescriptionList columns={1} items={[
                  { label: t('adm.field.bacYear'), value: a.academic.baccalaureateYear },
                  { label: t('adm.field.bacStream'), value: a.academic.baccalaureateStream },
                  { label: t('adm.field.bacAverage'), value: `${a.academic.baccalaureateAverage.toFixed(2)} / 20` },
                  { label: t('adm.field.previousInstitution'), value: a.academic.previousInstitution },
                  { label: t('adm.field.previousDegree'), value: a.academic.previousDegree },
                ]} />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title={t('adm.section.documents')} icon={FileCheck2} subtitle={t('adm.docs.count', { verified: a.completion.verified, required: a.completion.required })} />
            {problems > 0 && (
              <div className="mx-5 mt-4 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="text-sm font-bold">{t('adm.docs.problemsTitle', { n: problems })}</p>
                  <p className="text-xs">{t('adm.docs.problemsHint')}</p>
                </div>
              </div>
            )}
            <ul className="mt-2 divide-y divide-slate-100">
              {a.documents.map((d) => (
                <DocumentRow key={d.id} doc={d} canReview={reviewable} onReview={setReviewDoc} onPreview={(x) => setPreview({ name: x.fileName ?? '', url: x.url ?? undefined, mimeType: x.mimeType ?? undefined })} />
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title={t('common.status')} icon={CheckCircle2} />
            <CardBody className="space-y-5">
              <div className="flex items-center justify-between">
                <ApplicationStatusBadge status={a.status} />
                <span className="text-xs text-slate-400">{formatDateTime(a.updatedAt)}</span>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold text-slate-500">{t('adm.col.documents')}</p>
                <ProgressBar value={pct} tone={pct >= 100 ? 'green' : 'blue'} />
              </div>
              <DecisionActions application={a} canDecide={canDecide} onChanged={(x) => setData(x)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('adm.section.submission')} />
            <CardBody>
              <DescriptionList columns={1} items={[
                { label: t('adm.field.submittedAt'), value: formatDateTime(a.submittedAt) },
                { label: t('adm.field.channel'), value: a.submission.channel },
                { label: t('adm.field.lastUpdate'), value: formatDateTime(a.updatedAt) },
              ]} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('adm.section.history')} icon={History} />
            <CardBody>
              <Timeline items={[...a.history].reverse().map((e) => ({ id: e.id, title: t(`adm.event.${e.action}`), time: formatDateTime(e.at), meta: `${t('common.by')} ${e.actor}`, body: e.comment, tone: eventTone[e.action] }))} />
            </CardBody>
          </Card>
        </div>
      </div>

      <DocumentPreview doc={preview} onClose={() => setPreview(null)} />
      <DocumentReviewDialog applicationId={a.id} doc={reviewDoc} onClose={() => setReviewDoc(null)} onUpdated={onDocUpdated} />
    </>
  );
}
