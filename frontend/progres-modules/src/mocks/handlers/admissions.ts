/** Mock backend for the registrar-side Admissions & Registration endpoints (state lives in memory, resets on reload). */
import { mock, MockHttpError } from '../server';
import { listQuery } from '../query';
import { createRng, daysAgo, academicYears, currentAcademicYear } from '../seed';
import { people, fullName } from '../data/people';
import { programs, specialtyById } from '../data/catalog';
import { demoFileUrl, makePdfBlob } from '../files';
import type {
  AdmissionsDashboard,
  ApplicationDetail,
  ApplicationDocument,
  ApplicationEvent,
  ApplicationStatus,
  DecisionKind,
  DecisionRecord,
  DocumentStatus,
  DocumentType,
  EnrollmentStatus,
  Registration,
} from '@/modules/admissions/types';

const rng = createRng(4242);
const ACTORS = ['Ikram', 'S. Boudiaf', 'N. Merabet', 'K. Haddad'];

const DOC_TYPES: DocumentType[] = ['identity', 'baccalaureate', 'birth_certificate', 'photo', 'residence', 'transcript'];
const DOC_NAMES: Record<DocumentType, string> = {
  identity: 'carte_identite',
  baccalaureate: 'releve_bac',
  birth_certificate: 'acte_naissance',
  photo: 'photo_identite',
  residence: 'certificat_residence',
  transcript: 'releves_notes',
};
const STREAMS = ['Sciences expérimentales', 'Mathématiques', 'Technique mathématique', 'Gestion et économie', 'Lettres et philosophie', 'Langues étrangères'];
const INSTITUTIONS = ['Université de Batna 2', 'USTHB Alger', 'Université d\'Oran 1', 'Université de Constantine 1', 'Université de Sétif 1'];

interface AppRecord extends ApplicationDetail {
  _personId: string;
}

const years = academicYears(3);
const current = currentAcademicYear();
const appPrograms = programs.filter((p) => p.level === 'L1' || p.level === 'M1' || p.level === 'L2' || p.level === 'L3' || p.level === 'M2');

function makeDocs(appIdx: number, level: string, status: ApplicationStatus, submittedAt: string): ApplicationDocument[] {
  const types = level === 'L1' ? DOC_TYPES.filter((t) => t !== 'transcript') : DOC_TYPES;
  return types.map((type, i) => {
    const id = `DOC-${appIdx}-${i + 1}`;
    // pick a document state according to the application status
    let docStatus: DocumentStatus;
    if (status === 'accepted') docStatus = 'valid';
    else if (status === 'submitted') docStatus = rng.chance(0.08) ? 'missing' : 'pending';
    else if (status === 'under_review') docStatus = rng.weighted<DocumentStatus>([['valid', 5], ['pending', 3], ['incomplete', 0.5]]);
    else if (status === 'needs_correction') docStatus = rng.weighted<DocumentStatus>([['valid', 3], ['invalid', 2], ['incomplete', 1.5], ['missing', 1]]);
    else docStatus = rng.weighted<DocumentStatus>([['valid', 3], ['invalid', 2], ['incomplete', 1]]);
    // guarantee that correction requests show at least one problematic document
    if (status === 'needs_correction' && i === 1 && docStatus === 'valid') docStatus = 'invalid';
    const isImage = type === 'photo' || (type === 'identity' && rng.chance(0.5));
    const missing = docStatus === 'missing';
    const ext = isImage ? 'jpg' : 'pdf';
    const fileName = missing ? null : `${DOC_NAMES[type]}.${ext}`;
    return {
      id,
      type,
      fileName,
      mimeType: missing ? null : isImage ? 'image/jpeg' : 'application/pdf',
      size: missing ? null : rng.int(120, 2400) * 1024,
      uploadedAt: missing ? null : submittedAt,
      status: docStatus,
      reviewComment: docStatus === 'invalid' ? 'Document illisible ou non conforme.' : docStatus === 'incomplete' ? 'Pages manquantes, merci de fournir le document complet.' : undefined,
      reviewedBy: ['valid', 'invalid', 'incomplete'].includes(docStatus) ? rng.pick(ACTORS) : undefined,
      reviewedAt: ['valid', 'invalid', 'incomplete'].includes(docStatus) ? daysAgo(rng.int(0, 5)) : undefined,
      url: null, // filled lazily (see withUrls)
    };
  });
}

const STATUS_WEIGHTS: [ApplicationStatus, number][] = [
  ['submitted', 22],
  ['under_review', 20],
  ['accepted', 30],
  ['rejected', 9],
  ['needs_correction', 11],
];

const applications: AppRecord[] = Array.from({ length: 148 }, (_, i) => {
  const person = people[i % people.length];
  const program = rng.pick(appPrograms);
  const spec = specialtyById(program.specialtyId)!;
  const status = rng.weighted(STATUS_WEIGHTS);
  const yearIdx = rng.weighted([[0, 8], [1, 2], [2, 1]] as const);
  const academicYear = years[yearIdx];
  const age = status === 'submitted' ? rng.int(0, 25) : status === 'under_review' ? rng.int(2, 45) : rng.int(5, 150);
  const submittedAt = i < 4 ? daysAgo(i, 8 + i, 15) : daysAgo(age + (yearIdx ? yearIdx * 300 : 0), rng.int(8, 17), rng.int(0, 59));
  const documents = makeDocs(i + 1, program.level, status, submittedAt);
  const events: ApplicationEvent[] = [{ id: `EV-${i}-1`, action: 'submitted', actor: fullName(person), at: submittedAt }];
  let decisionComment: string | undefined;
  if (status !== 'submitted') events.push({ id: `EV-${i}-2`, action: 'review_started', actor: rng.pick(ACTORS), at: new Date(new Date(submittedAt).getTime() + 86400000).toISOString() });
  if (status === 'accepted') events.push({ id: `EV-${i}-3`, action: 'accepted', actor: rng.pick(ACTORS), at: new Date(new Date(submittedAt).getTime() + 3 * 86400000).toISOString(), comment: 'Dossier complet et conforme.' });
  if (status === 'rejected') {
    decisionComment = rng.pick(['Capacité d\'accueil atteinte pour ce programme.', 'Les conditions d\'accès au niveau demandé ne sont pas remplies.', 'Moyenne du baccalauréat inférieure au seuil requis.']);
    events.push({ id: `EV-${i}-3`, action: 'rejected', actor: rng.pick(ACTORS), at: new Date(new Date(submittedAt).getTime() + 3 * 86400000).toISOString(), comment: decisionComment });
  }
  if (status === 'needs_correction') {
    decisionComment = rng.pick(['Le relevé du baccalauréat est illisible, merci de le fournir à nouveau.', 'L\'acte de naissance fourni est incomplet (extrait sans filiation).', 'La photo d\'identité ne respecte pas le format demandé.']);
    events.push({ id: `EV-${i}-3`, action: 'correction_requested', actor: rng.pick(ACTORS), at: new Date(new Date(submittedAt).getTime() + 2 * 86400000).toISOString(), comment: decisionComment });
  }
  const updatedAt = events[events.length - 1].at;
  return {
    _personId: person.id,
    id: `APP-${academicYear.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`,
    reference: `ADM-${academicYear.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`,
    studentName: fullName(person),
    studentId: person.studentId,
    email: person.email,
    academicYear,
    programId: program.id,
    programName: program.name,
    programNameAr: program.nameAr,
    level: program.level,
    specialty: spec.name,
    specialtyAr: spec.nameAr,
    submittedAt,
    updatedAt,
    status,
    completion: { required: documents.length, uploaded: 0, verified: 0 },
    student: {
      firstName: person.firstName,
      lastName: person.lastName,
      sex: person.sex,
      birthDate: person.birthDate,
      birthPlace: person.birthPlace,
      nationality: person.nationality,
      phone: person.phone,
      address: person.address,
    },
    academic: {
      baccalaureateYear: Number(academicYear.slice(0, 4)) - (program.level === 'L1' ? 1 : program.level === 'L2' ? 2 : program.level === 'L3' ? 3 : 5),
      baccalaureateStream: rng.pick(STREAMS),
      baccalaureateAverage: Math.round((10 + rng.next() * 8) * 100) / 100,
      previousInstitution: program.level === 'L1' ? undefined : rng.pick(INSTITUTIONS),
      previousDegree: program.level === 'M1' ? 'Licence' : program.level === 'M2' ? 'Master 1' : program.level === 'L1' ? undefined : `Licence ${program.level === 'L2' ? '1' : '2'}`,
      choiceRank: rng.int(1, 3),
    },
    documents,
    history: events,
    decisionComment,
    submission: { channel: 'Portail étudiant', ip: `105.${rng.int(96, 111)}.${rng.int(1, 250)}.${rng.int(1, 250)}` },
  };
});
applications.forEach(recount);

function recount(a: AppRecord) {
  a.completion = {
    required: a.documents.length,
    uploaded: a.documents.filter((d) => d.status !== 'missing').length,
    verified: a.documents.filter((d) => d.status === 'valid').length,
  };
}

function withUrls(a: AppRecord): ApplicationDetail {
  const copy: AppRecord = { ...a, documents: a.documents.map((d) => ({ ...d })) };
  copy.documents.forEach((d) => {
    if (!d.fileName) return;
    d.url = demoFileUrl(d.mimeType === 'application/pdf' ? 'pdf' : 'image', d.fileName, `${a.studentName} · ${a.reference}`);
  });
  return copy;
}

// ---- decision log --------------------------------------------------------------------------------
const decisions: DecisionRecord[] = [];
function logDecision(a: AppRecord, decision: DecisionKind, actor: string, at: string, comment?: string) {
  decisions.push({
    id: `DEC-${decisions.length + 1}`,
    applicationId: a.id,
    reference: a.reference,
    studentName: a.studentName,
    studentId: a.studentId,
    programName: a.programName,
    programNameAr: a.programNameAr,
    level: a.level,
    decision,
    comment,
    actor,
    at,
  });
}
for (const a of applications) {
  for (const ev of a.history) {
    const map: Partial<Record<ApplicationEvent['action'], DecisionKind>> = { accepted: 'accept', rejected: 'reject', correction_requested: 'request_correction', review_started: 'start_review' };
    const d = map[ev.action];
    if (d) logDecision(a, d, ev.actor, ev.at, ev.comment);
  }
}
decisions.sort((x, y) => y.at.localeCompare(x.at));

// ---- registrations -------------------------------------------------------------------------------
const registrations: Registration[] = [];
function registerFrom(a: AppRecord, at: string) {
  registrations.push({
    id: `REG-${a.id.slice(4)}`,
    applicationId: a.id,
    studentName: a.studentName,
    studentId: a.studentId,
    email: a.email,
    programId: a.programId,
    programName: a.programName,
    programNameAr: a.programNameAr,
    level: a.level,
    specialty: a.specialty,
    specialtyAr: a.specialtyAr,
    academicYear: a.academicYear,
    registeredAt: at,
    enrollmentStatus: rng.weighted<EnrollmentStatus>([['enrolled', 12], ['pending_payment', 3], ['suspended', 0.4], ['withdrawn', 0.6]]),
    certificateAvailable: rng.chance(0.85),
  });
}
applications.filter((a) => a.status === 'accepted').forEach((a) => registerFrom(a, a.updatedAt));

const actorNow = 'Ikram';
const nowIso = () => new Date().toISOString();

function findApp(id: string) {
  const a = applications.find((x) => x.id === id);
  if (!a) throw new MockHttpError(404, 'Candidature introuvable');
  return a;
}

function transition(a: AppRecord, to: ApplicationStatus, action: ApplicationEvent['action'], decision: DecisionKind, comment?: string) {
  const at = nowIso();
  a.status = to;
  a.updatedAt = at;
  a.decisionComment = comment && (to === 'rejected' || to === 'needs_correction') ? comment : to === 'accepted' ? undefined : a.decisionComment;
  a.history.push({ id: `EV-${a.id}-${a.history.length + 1}`, action, actor: actorNow, at, comment });
  logDecision(a, decision, actorNow, at, comment);
  decisions.sort((x, y) => y.at.localeCompare(x.at));
}

// ---- routes --------------------------------------------------------------------------------------
const toListItem = ({ _personId, student, academic, documents, history, decisionComment, submission, ...rest }: AppRecord) => rest;

mock.get('/admissions/filters', () => ({
  academicYears: years,
  programs: programs.map((p) => ({ id: p.id, name: p.name, nameAr: p.nameAr, level: p.level })).sort((a, b) => a.name.localeCompare(b.name) || a.level.localeCompare(b.level)),
}));

mock.get('/admissions/dashboard', (): AdmissionsDashboard => {
  const count = (s: ApplicationStatus) => applications.filter((a) => a.status === s).length;
  const cur = applications.filter((a) => a.academicYear === current);
  const months: AdmissionsDashboard['trend'] = [];
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const inMonth = applications.filter((a) => {
      const s = new Date(a.submittedAt);
      return s.getFullYear() === d.getFullYear() && s.getMonth() === d.getMonth();
    });
    months.push({ month: String(d.getMonth() + 1), submitted: inMonth.length, accepted: inMonth.filter((a) => a.status === 'accepted').length });
  }
  const levels = ['L1', 'L2', 'L3', 'M1', 'M2'] as const;
  return {
    totals: {
      total: applications.length,
      submitted: count('submitted'),
      underReview: count('under_review'),
      accepted: count('accepted'),
      rejected: count('rejected'),
      needsCorrection: count('needs_correction'),
    },
    trend: months,
    byLevel: levels.map((level) => ({ level, count: cur.filter((a) => a.level === level).length })),
    recentApplications: [...applications].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 6).map(toListItem),
    recentActions: decisions.filter((d) => d.decision !== 'start_review').slice(0, 6),
  };
});

mock.get('/admissions/applications', ({ query }) =>
  listQuery(applications.map(toListItem), query, {
    searchFields: [(a) => a.studentName, (a) => a.studentId, (a) => a.reference],
    filters: { academicYear: (a) => a.academicYear, level: (a) => a.level, programId: (a) => a.programId, status: (a) => a.status },
    dateRange: { from: 'dateFrom', to: 'dateTo', accessor: (a) => a.submittedAt },
    sorters: {
      studentName: (a) => a.studentName,
      studentId: (a) => a.studentId,
      academicYear: (a) => a.academicYear,
      programName: (a) => a.programName,
      level: (a) => a.level,
      submittedAt: (a) => a.submittedAt,
      status: (a) => a.status,
      completion: (a) => a.completion.verified / Math.max(1, a.completion.required),
    },
    defaultSort: { key: 'submittedAt', dir: 'desc' },
  }),
);

mock.get('/admissions/applications/:id', ({ params }) => withUrls(findApp(params.id)));

mock.post('/admissions/applications/:id/start-review', ({ params }) => {
  const a = findApp(params.id);
  if (a.status !== 'submitted') throw new MockHttpError(409, 'Seules les candidatures soumises peuvent être prises en charge.');
  transition(a, 'under_review', 'review_started', 'start_review');
  return withUrls(a);
});

mock.post('/admissions/applications/:id/accept', ({ params, body }) => {
  const a = findApp(params.id);
  if (a.status !== 'under_review') throw new MockHttpError(409, 'La candidature doit être en cours d\'examen pour être acceptée.');
  transition(a, 'accepted', 'accepted', 'accept', body?.comment);
  registerFrom(a, a.updatedAt);
  return withUrls(a);
});

mock.post('/admissions/applications/:id/reject', ({ params, body }) => {
  const a = findApp(params.id);
  if (!body?.comment?.trim()) throw new MockHttpError(422, 'Un commentaire est obligatoire pour rejeter une candidature.', { comment: 'required' });
  if (a.status !== 'under_review') throw new MockHttpError(409, 'La candidature doit être en cours d\'examen pour être rejetée.');
  transition(a, 'rejected', 'rejected', 'reject', body.comment.trim());
  return withUrls(a);
});

mock.post('/admissions/applications/:id/request-correction', ({ params, body }) => {
  const a = findApp(params.id);
  if (!body?.comment?.trim()) throw new MockHttpError(422, 'Un commentaire est obligatoire pour demander une correction.', { comment: 'required' });
  if (a.status !== 'under_review') throw new MockHttpError(409, 'La candidature doit être en cours d\'examen pour demander une correction.');
  transition(a, 'needs_correction', 'correction_requested', 'request_correction', body.comment.trim());
  return withUrls(a);
});

mock.patch('/admissions/applications/:id/documents/:docId', ({ params, body }) => {
  const a = findApp(params.id);
  const d = a.documents.find((x) => x.id === params.docId);
  if (!d) throw new MockHttpError(404, 'Document introuvable');
  if (a.status !== 'under_review' && a.status !== 'submitted') throw new MockHttpError(409, 'Les documents ne peuvent plus être modifiés pour cette candidature.');
  if (!d.fileName) throw new MockHttpError(409, 'Aucun fichier n\'a été téléversé pour ce document.');
  if (['invalid', 'incomplete'].includes(body.status) && !body.comment?.trim()) throw new MockHttpError(422, 'Un commentaire est obligatoire.', { comment: 'required' });
  d.status = body.status;
  d.reviewComment = body.comment?.trim() || undefined;
  d.reviewedBy = actorNow;
  d.reviewedAt = nowIso();
  recount(a);
  return { ...d, url: demoFileUrl(d.mimeType === 'application/pdf' ? 'pdf' : 'image', d.fileName, `${a.studentName} · ${a.reference}`) };
});

mock.get('/admissions/decisions', ({ query }) =>
  listQuery(decisions, query, {
    searchFields: [(d) => d.studentName, (d) => d.studentId, (d) => d.reference],
    filters: { decision: (d) => d.decision },
    sorters: { at: (d) => d.at, studentName: (d) => d.studentName, decision: (d) => d.decision, actor: (d) => d.actor },
    defaultSort: { key: 'at', dir: 'desc' },
  }),
);

mock.get('/admissions/registrations', ({ query }) =>
  listQuery(registrations, query, {
    searchFields: [(r) => r.studentName, (r) => r.studentId],
    filters: { academicYear: (r) => r.academicYear, programId: (r) => r.programId, level: (r) => r.level, enrollmentStatus: (r) => r.enrollmentStatus },
    sorters: { studentName: (r) => r.studentName, programName: (r) => r.programName, academicYear: (r) => r.academicYear, registeredAt: (r) => r.registeredAt, enrollmentStatus: (r) => r.enrollmentStatus, level: (r) => r.level },
    defaultSort: { key: 'registeredAt', dir: 'desc' },
  }),
);

mock.get('/admissions/registrations/:id/certificate', ({ params }) => {
  const r = registrations.find((x) => x.id === params.id);
  if (!r) throw new MockHttpError(404, 'Inscription introuvable');
  if (!r.certificateAvailable) throw new MockHttpError(404, 'Le certificat d\'inscription n\'est pas encore disponible.');
  return makePdfBlob('CERTIFICAT D\'INSCRIPTION', [
    `Etudiant : ${r.studentName}`,
    `Matricule : ${r.studentId}`,
    `Programme : ${r.programName} (${r.level})`,
    `Annee universitaire : ${r.academicYear}`,
    `Date d'inscription : ${r.registeredAt.slice(0, 10)}`,
  ]);
});
