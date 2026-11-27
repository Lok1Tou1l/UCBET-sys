/** Mock backend for Renovation & Contractor Management. State is in memory and resets on reload. */
import { mock, MockHttpError } from '../server';
import { listQuery } from '../query';
import { createRng, daysAgo, daysFromNow, isoDate, nextId } from '../seed';
import { demoFileUrl } from '../files';
import type {
  Assignment,
  Contractor,
  ContractorStatus,
  DocumentCategory,
  ProgressUpdate,
  ProjectDetail,
  ProjectDocument,
  ProjectListItem,
  ProjectPhase,
  ProjectStatus,
  RenovationDashboard,
  StatusChange,
} from '@/modules/renovation/types';
import { PROJECT_PHASES, PROJECT_STATUSES, CONTRACTOR_STATUSES, DOCUMENT_CATEGORIES } from '@/modules/renovation/types';

const rng = createRng(31337);
const ACTOR = { id: 'u-ikram', name: 'Ikram' };
const STAFF = ['Ikram', 'M. Brahimi', 'S. Taleb', 'R. Hamidi'];

/** transitions accepted by the (mock) backend – the UI only reads `allowedStatuses` from the API */
const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planned: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active', 'cancelled'],
  completed: [],
  cancelled: [],
};

// ---- contractors ------------------------------------------------------------------------------------
const CONTRACTOR_SEED: [string, string, string, string, string][] = [
  ['SARL Batimex Constructions', 'Karim Boudiaf', 'Gros œuvre', 'Batna', 'contact@batimex-demo.dz'],
  ['EURL ElecPro Algérie', 'Nassim Cherif', 'Électricité', 'Constantine', 'info@elecpro-demo.dz'],
  ['SPA Hydro Services', 'Amine Haddad', 'Plomberie & sanitaire', 'Alger', 'contact@hydroservices-demo.dz'],
  ['SARL Peinture Moderne', 'Yacine Khelifi', 'Peinture & revêtements', 'Sétif', 'devis@peinturemoderne-demo.dz'],
  ['EURL Étanch Plus', 'Riad Merabet', 'Étanchéité', 'Batna', 'contact@etanchplus-demo.dz'],
  ['SARL Menuiserie El Atlas', 'Walid Saidi', 'Menuiserie', 'Khenchela', 'atlas@menuiserie-demo.dz'],
  ['SPA ClimaTech', 'Sofiane Belkacem', 'Climatisation & ventilation', 'Oran', 'service@climatech-demo.dz'],
  ['SARL Sécurité Incendie DZ', 'Bilal Hamidi', 'Sécurité incendie', 'Alger', 'contact@secu-incendie-demo.dz'],
  ['EURL Aluverre Est', 'Mehdi Zerrouki', 'Aluminium & vitrage', 'Annaba', 'contact@aluverre-demo.dz'],
  ['SARL Carrelage Premium', 'Anis Ouali', 'Carrelage & faïence', 'Biskra', 'commercial@carrelage-demo.dz'],
];
const contractors: Contractor[] = CONTRACTOR_SEED.map(([companyName, contactPerson, activity, city, email], i) => ({
  id: `CTR-${String(i + 1).padStart(3, '0')}`,
  companyName,
  contactPerson,
  email,
  phone: `0${rng.pick([5, 6, 7])}${rng.int(50, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)} ${rng.int(10, 99)}`,
  address: `${rng.int(2, 80)} Zone d'activités, ${city}`,
  city,
  activity,
  registrationNumber: `RC-${rng.int(10, 99)}/B-${rng.int(1000000, 9999999)}`,
  foundedYear: rng.int(1998, 2018),
  website: `www.${email.split('@')[1]}`,
  description: `Entreprise spécialisée en ${activity.toLowerCase()} intervenant sur des chantiers publics et universitaires.`,
  status: i === 7 ? 'inactive' : i === 9 ? 'suspended' : 'active',
  projectCount: 0,
  activeProjectCount: 0,
  createdAt: daysAgo(rng.int(200, 900)),
  updatedAt: daysAgo(rng.int(1, 60)),
}));

// ---- projects ---------------------------------------------------------------------------------------
interface ProjectRec extends ProjectListItem {
  notes?: string;
  statusHistory: StatusChange[];
}
const PROJECT_SEED: [string, string, string, ProjectStatus, number, ProjectPhase, number, number, string | null][] = [
  // title, description, location, status, progress, phase, startOffset(days), durationDays, contractorId
  ['Rénovation Bâtiment A', 'Réhabilitation complète du bloc pédagogique A : toiture, façades, menuiseries et réseaux.', 'Bloc A', 'active', 75, 'finishing', -150, 210, 'CTR-001'],
  ['Réfection Amphi B', 'Remplacement des sièges, acoustique et éclairage de l\'amphithéâtre B.', 'Amphi B', 'planned', 0, 'preparation', 25, 120, 'CTR-006'],
  ['Mise à niveau Résidence U', 'Mise aux normes électrique et sanitaire de la résidence universitaire.', 'Résidence U', 'completed', 100, 'handover', -300, 240, 'CTR-003'],
  ['Étanchéité toiture Bibliothèque centrale', 'Reprise complète de l\'étanchéité de la terrasse et traitement des infiltrations.', 'Bibliothèque centrale', 'active', 45, 'structural', -60, 120, 'CTR-005'],
  ['Rénovation des laboratoires de chimie', 'Ventilation, paillasses et réseaux de fluides des laboratoires du bloc C.', 'Bloc C', 'paused', 35, 'structural', -120, 200, 'CTR-007'],
  ['Installation climatisation salles de TD', 'Fourniture et pose de systèmes de climatisation dans 18 salles de travaux dirigés.', 'Bloc B', 'active', 60, 'equipment', -90, 150, 'CTR-007'],
  ['Peinture et revêtements Bloc C', 'Peinture intérieure, faux plafonds et revêtements de sol des couloirs.', 'Bloc C', 'planned', 0, 'preparation', 40, 90, 'CTR-004'],
  ['Rénovation sanitaires Bloc B', 'Remplacement des appareils sanitaires et de la plomberie du bloc B.', 'Bloc B', 'active', 20, 'preparation', -25, 80, 'CTR-003'],
  ['Mise aux normes sécurité incendie', 'Détection, alarmes et extincteurs pour l\'ensemble des bâtiments pédagogiques.', 'Campus central', 'active', 85, 'inspection', -170, 200, 'CTR-008'],
  ['Remplacement menuiseries Résidence 2', 'Dépose et remplacement des fenêtres et portes de la résidence 2.', 'Résidence 2', 'cancelled', 10, 'preparation', -140, 100, 'CTR-006'],
  ['Réhabilitation de la salle des conférences', 'Rénovation du hall, de la scène et des équipements audiovisuels.', 'Rectorat', 'completed', 100, 'handover', -260, 180, 'CTR-009'],
  ['Rénovation du réseau électrique Campus Nord', 'Remplacement des armoires, câblage et mise à la terre.', 'Campus Nord', 'active', 52, 'structural', -75, 140, 'CTR-002'],
  ['Réfection du restaurant universitaire', 'Cuisine, chambres froides, carrelage et ventilation du restaurant universitaire.', 'Restaurant universitaire', 'planned', 0, 'preparation', 70, 160, null],
  ['Aménagement des façades Bloc A', 'Ravalement et isolation thermique extérieure des façades du bloc A.', 'Bloc A', 'paused', 18, 'preparation', -45, 130, 'CTR-009'],
];

const projects: ProjectRec[] = [];
const progressUpdates: ProgressUpdate[] = [];
const assignments: Assignment[] = [];
const documents: ProjectDocument[] = [];

const nowIso = () => new Date().toISOString();
const phaseIndex = (p: ProjectPhase) => PROJECT_PHASES.indexOf(p);

PROJECT_SEED.forEach(([title, description, location, status, progress, phase, startOff, duration, contractorId], i) => {
  const id = `PRJ-${String(i + 1).padStart(3, '0')}`;
  const startDate = isoDate(daysFromNow(startOff));
  const expectedEndDate = isoDate(daysFromNow(startOff + duration));
  const history: StatusChange[] = [{ id: `${id}-S0`, from: null, to: 'planned', by: rng.pick(STAFF), at: daysAgo(Math.max(1, -startOff + 20)), comment: 'Création du projet' }];
  if (status !== 'planned') history.push({ id: `${id}-S1`, from: 'planned', to: 'active', by: rng.pick(STAFF), at: daysAgo(Math.max(1, -startOff)) });
  if (status === 'paused') history.push({ id: `${id}-S2`, from: 'active', to: 'paused', by: rng.pick(STAFF), at: daysAgo(rng.int(5, 20)), comment: 'Suspension : attente de matériaux importés.' });
  if (status === 'completed') history.push({ id: `${id}-S2`, from: 'active', to: 'completed', by: rng.pick(STAFF), at: daysAgo(rng.int(10, 40)), comment: 'Réception provisoire prononcée.' });
  if (status === 'cancelled') history.push({ id: `${id}-S2`, from: 'active', to: 'cancelled', by: rng.pick(STAFF), at: daysAgo(rng.int(10, 40)), comment: 'Annulation : budget redéployé sur un autre projet.' });
  const c = contractors.find((x) => x.id === contractorId);
  const rec: ProjectRec = {
    id, reference: `REN-2026-${String(i + 1).padStart(3, '0')}`, title, description, location, startDate, expectedEndDate, status, progress, phase,
    contractorId: c?.id ?? null, contractorName: c?.companyName ?? null,
    createdAt: daysAgo(Math.max(2, -startOff + 25)), updatedAt: history[history.length - 1].at, lastProgressAt: null,
    notes: i % 3 === 0 ? 'Coordination avec le service de maintenance pour limiter les nuisances pendant les cours.' : undefined, statusHistory: history,
  };
  projects.push(rec);

  // assignment history
  if (c) {
    assignments.push({ id: `ASG-${id}-1`, projectId: id, projectTitle: title, contractorId: c.id, contractorName: c.companyName, assignedAt: daysAgo(Math.max(1, -startOff + 10)), assignedBy: rng.pick(STAFF), endedAt: null, note: 'Marché attribué après consultation.', current: true });
  }

  // progress history: monotone steps toward the current progress
  if (progress > 0) {
    const steps = Math.max(2, Math.min(6, Math.ceil(progress / 18)));
    let prev = 0;
    let prevPhase: ProjectPhase | null = null;
    let prevStatus: ProjectStatus | null = 'planned';
    for (let k = 1; k <= steps; k++) {
      const value = k === steps ? progress : Math.round((progress * k) / steps);
      const ph = PROJECT_PHASES[Math.min(phaseIndex(phase), Math.floor(((k - 1) / steps) * (phaseIndex(phase) + 1)))];
      const ago = Math.max(1, Math.round(((steps - k) / steps) * Math.min(-startOff, 100)) + rng.int(0, 4));
      progressUpdates.push({
        id: `PRG-${id}-${k}`, projectId: id, projectTitle: title, progress: value, previousProgress: prev, phase: k === steps ? phase : ph, previousPhase: prevPhase, status: 'active', previousStatus: prevStatus,
        updateDate: isoDate(daysAgo(ago)), createdAt: daysAgo(ago, rng.int(8, 17), rng.int(0, 59)),
        note: rng.pick(['Avancement conforme au planning.', 'Livraison des matériaux effectuée, reprise des travaux.', 'Contrôle qualité réalisé par le bureau de suivi.', 'Équipes renforcées sur le chantier pour rattraper le retard.', 'Finitions en cours sur les zones achevées.', 'Réunion de chantier hebdomadaire tenue.']),
        author: { id: `u-${k}`, name: rng.pick(STAFF) },
      });
      prev = value;
      prevPhase = k === steps ? phase : ph;
      prevStatus = 'active';
    }
    const last = progressUpdates.filter((u) => u.projectId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    rec.lastProgressAt = last.createdAt;
    if (status === 'planned' || status === 'completed' || status === 'cancelled') rec.updatedAt = rec.updatedAt > last.createdAt ? rec.updatedAt : last.createdAt;
    else rec.updatedAt = last.createdAt;
  }

  // documents (real, previewable demo files)
  const docSeeds: [string, DocumentCategory, 'pdf' | 'image'][] = [['plan_masse', 'plan', 'pdf'], ['contrat_marche', 'contract', 'pdf'], ['rapport_visite', 'report', 'pdf'], ['photo_chantier', 'photo', 'image']];
  docSeeds.slice(0, status === 'planned' ? 2 : 4).forEach(([name, category, kind], k) => {
    const fileName = `${name}_${id.toLowerCase()}.${kind === 'pdf' ? 'pdf' : 'jpg'}`;
    documents.push({ id: `DOC-${id}-${k + 1}`, projectId: id, projectTitle: title, name: fileName, category, mimeType: kind === 'pdf' ? 'application/pdf' : 'image/jpeg', size: rng.int(180, 3400) * 1024, uploadedAt: daysAgo(rng.int(2, 90)), uploadedBy: rng.pick(STAFF), url: demoFileUrl(kind, fileName, `${title} · ${location}`) });
  });
});

// ---- helpers ----------------------------------------------------------------------------------------
const findProject = (id: string) => {
  const p = projects.find((x) => x.id === id);
  if (!p) throw new MockHttpError(404, 'Projet introuvable');
  return p;
};
const findContractor = (id: string) => {
  const c = contractors.find((x) => x.id === id);
  if (!c) throw new MockHttpError(404, 'Entreprise introuvable');
  return c;
};
function refreshContractorCounts() {
  contractors.forEach((c) => {
    const mine = projects.filter((p) => p.contractorId === c.id);
    c.projectCount = mine.length;
    c.activeProjectCount = mine.filter((p) => p.status === 'active').length;
  });
}
refreshContractorCounts();

const listItem = ({ notes, statusHistory, ...rest }: ProjectRec): ProjectListItem => rest;
const detail = (p: ProjectRec): ProjectDetail => ({
  ...listItem(p),
  notes: p.notes,
  contractor: p.contractorId ? { ...findContractor(p.contractorId) } : null,
  currentAssignment: assignments.find((a) => a.projectId === p.id && a.current) ?? null,
  statusHistory: [...p.statusHistory].sort((a, b) => b.at.localeCompare(a.at)),
  allowedStatuses: TRANSITIONS[p.status],
  documentCount: documents.filter((d) => d.projectId === p.id).length,
  progressUpdateCount: progressUpdates.filter((u) => u.projectId === p.id).length,
});
const fail = (status: number, message: string, errors?: Record<string, string>) => {
  throw new MockHttpError(status, message, errors);
};

function validateProject(b: any) {
  const errors: Record<string, string> = {};
  if (!b.title?.trim()) errors.title = 'required';
  if (!b.location?.trim()) errors.location = 'required';
  if (!b.startDate) errors.startDate = 'required';
  if (!b.expectedEndDate) errors.expectedEndDate = 'required';
  if (b.startDate && b.expectedEndDate && b.expectedEndDate < b.startDate) errors.expectedEndDate = 'La date de fin prévue doit être postérieure à la date de début.';
  if (!PROJECT_STATUSES.includes(b.status)) errors.status = 'invalid';
  if (Object.keys(errors).length) fail(422, 'Le formulaire contient des erreurs.', errors);
  if (b.contractorId && !contractors.find((c) => c.id === b.contractorId)) fail(422, 'Entreprise inconnue', { contractorId: 'unknown' });
}

function assignContractor(p: ProjectRec, contractorId: string, note?: string) {
  const c = findContractor(contractorId);
  if (c.status !== 'active') fail(409, `L'entreprise « ${c.companyName} » n'est pas active et ne peut pas être affectée.`, { contractorId: 'inactive' });
  const current = assignments.find((a) => a.projectId === p.id && a.current);
  if (current?.contractorId === c.id) return current;
  if (current) {
    current.current = false;
    current.endedAt = nowIso();
  }
  const a: Assignment = { id: nextId('ASG'), projectId: p.id, projectTitle: p.title, contractorId: c.id, contractorName: c.companyName, assignedAt: nowIso(), assignedBy: ACTOR.name, endedAt: null, note: note?.trim() || undefined, current: true };
  assignments.push(a);
  p.contractorId = c.id;
  p.contractorName = c.companyName;
  p.updatedAt = nowIso();
  refreshContractorCounts();
  return a;
}

function changeStatus(p: ProjectRec, to: ProjectStatus, comment?: string) {
  if (!TRANSITIONS[p.status].includes(to)) fail(409, `Transition de statut non autorisée : ${p.status} → ${to}.`);
  p.statusHistory.push({ id: nextId('STS'), from: p.status, to, comment: comment?.trim() || undefined, by: ACTOR.name, at: nowIso() });
  p.status = to;
  p.updatedAt = nowIso();
  refreshContractorCounts();
}

// ---- routes: filters / dashboard ---------------------------------------------------------------------
mock.get('/renovation/filters', () => ({
  locations: [...new Set(projects.map((p) => p.location))].sort(),
  contractors: contractors.map((c) => ({ id: c.id, name: c.companyName, status: c.status })).sort((a, b) => a.name.localeCompare(b.name)),
  projects: projects.map((p) => ({ id: p.id, title: p.title, status: p.status })).sort((a, b) => a.title.localeCompare(b.title)),
  activities: [...new Set(contractors.map((c) => c.activity))].sort(),
}));

mock.get('/renovation/dashboard', (): RenovationDashboard => {
  const count = (s: ProjectStatus) => projects.filter((p) => p.status === s).length;
  const now = new Date();
  const trend: RenovationDashboard['updatesTrend'] = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    trend.push({ month: String(d.getMonth() + 1), updates: progressUpdates.filter((u) => { const x = new Date(u.createdAt); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); }).length });
  }
  const running = projects.filter((p) => p.status === 'active' || p.status === 'paused');
  return {
    totals: {
      projects: projects.length, planned: count('planned'), active: count('active'), paused: count('paused'), completed: count('completed'), cancelled: count('cancelled'),
      contractors: contractors.length, activeContractors: contractors.filter((c) => c.status === 'active').length,
      averageProgress: running.length ? Math.round(running.reduce((a, p) => a + p.progress, 0) / running.length) : 0,
    },
    byStatus: PROJECT_STATUSES.map((status) => ({ status, count: count(status) })),
    progressByProject: [...running].sort((a, b) => b.progress - a.progress).slice(0, 8).map((p) => ({ id: p.id, title: p.title, progress: p.progress, status: p.status })),
    updatesTrend: trend,
    recentProjects: [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5).map(listItem),
    recentUpdates: [...progressUpdates].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
  };
});

// ---- projects ----------------------------------------------------------------------------------------
mock.get('/renovation/projects', ({ query }) =>
  listQuery(projects.map(listItem), query, {
    searchFields: [(p) => p.title, (p) => p.reference],
    filters: { status: (p) => p.status, location: (p) => p.location, contractorId: (p) => p.contractorId },
    dateRange: { from: 'dateFrom', to: 'dateTo', accessor: (p) => p.startDate },
    sorters: { title: (p) => p.title, location: (p) => p.location, startDate: (p) => p.startDate, expectedEndDate: (p) => p.expectedEndDate, status: (p) => p.status, progress: (p) => p.progress, updatedAt: (p) => p.updatedAt, contractorName: (p) => p.contractorName ?? '' },
    defaultSort: { key: 'updatedAt', dir: 'desc' },
  }),
);
mock.get('/renovation/projects/:id', ({ params }) => detail(findProject(params.id)));
mock.post('/renovation/projects', ({ body }) => {
  validateProject(body);
  const id = `PRJ-${String(projects.length + 1).padStart(3, '0')}`;
  const p: ProjectRec = {
    id, reference: `REN-2026-${String(projects.length + 1).padStart(3, '0')}`, title: body.title.trim(), description: body.description?.trim() || undefined, location: body.location.trim(), startDate: body.startDate, expectedEndDate: body.expectedEndDate,
    status: 'planned', progress: 0, phase: 'preparation', contractorId: null, contractorName: null, createdAt: nowIso(), updatedAt: nowIso(), lastProgressAt: null, notes: body.notes?.trim() || undefined,
    statusHistory: [{ id: nextId('STS'), from: null, to: 'planned', by: ACTOR.name, at: nowIso(), comment: 'Création du projet' }],
  };
  projects.unshift(p);
  if (body.contractorId) assignContractor(p, body.contractorId, 'Affectation initiale');
  if (body.status !== 'planned') {
    try {
      if (body.status === 'cancelled') changeStatus(p, 'cancelled', 'Statut initial');
      else if (body.status === 'active') changeStatus(p, 'active', 'Statut initial');
      else if (body.status === 'paused') { changeStatus(p, 'active', 'Statut initial'); changeStatus(p, 'paused', 'Statut initial'); }
      else if (body.status === 'completed') { changeStatus(p, 'active', 'Statut initial'); changeStatus(p, 'completed', 'Statut initial'); p.progress = 100; p.phase = 'handover'; }
    } catch { /* keep planned */ }
  }
  return detail(p);
});
mock.put('/renovation/projects/:id', ({ params, body }) => {
  const p = findProject(params.id);
  validateProject(body);
  Object.assign(p, { title: body.title.trim(), description: body.description?.trim() || undefined, location: body.location.trim(), startDate: body.startDate, expectedEndDate: body.expectedEndDate, notes: body.notes?.trim() || undefined, updatedAt: nowIso() });
  progressUpdates.filter((u) => u.projectId === p.id).forEach((u) => (u.projectTitle = p.title));
  assignments.filter((a) => a.projectId === p.id).forEach((a) => (a.projectTitle = p.title));
  documents.filter((d) => d.projectId === p.id).forEach((d) => (d.projectTitle = p.title));
  if (body.contractorId && body.contractorId !== p.contractorId) assignContractor(p, body.contractorId, 'Modification via le formulaire du projet');
  // status is changed only through PATCH /status (history is never overwritten)
  return detail(p);
});
mock.patch('/renovation/projects/:id/status', ({ params, body }) => {
  const p = findProject(params.id);
  if (!PROJECT_STATUSES.includes(body.status)) fail(422, 'Statut invalide', { status: 'invalid' });
  if (['cancelled', 'paused'].includes(body.status) && !body.comment?.trim()) fail(422, 'Un commentaire est obligatoire pour ce changement de statut.', { comment: 'required' });
  changeStatus(p, body.status, body.comment);
  if (body.status === 'completed') {
    const prev = p.progress;
    p.progress = 100;
    p.phase = 'handover';
    const at = nowIso();
    progressUpdates.push({ id: nextId('PRG'), projectId: p.id, projectTitle: p.title, progress: 100, previousProgress: prev, phase: 'handover', previousPhase: null, status: 'completed', previousStatus: 'active', updateDate: isoDate(at), createdAt: at, note: 'Clôture du projet.', author: ACTOR });
    p.lastProgressAt = at;
  }
  return detail(p);
});

// ---- progress ----------------------------------------------------------------------------------------
mock.get('/renovation/projects/:id/progress-updates', ({ params }) => {
  findProject(params.id);
  return progressUpdates.filter((u) => u.projectId === params.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.progress - a.progress);
});
mock.post('/renovation/projects/:id/progress-updates', ({ params, body }) => {
  const p = findProject(params.id);
  const errors: Record<string, string> = {};
  const progress = Number(body.progress);
  if (Number.isNaN(progress) || progress < 0 || progress > 100) errors.progress = '0-100';
  if (!PROJECT_PHASES.includes(body.phase)) errors.phase = 'invalid';
  if (!body.updateDate) errors.updateDate = 'required';
  else if (body.updateDate > isoDate(nowIso())) errors.updateDate = 'La date ne peut pas être dans le futur.';
  if (!body.note?.trim()) errors.note = 'required';
  if (Object.keys(errors).length) fail(422, 'Le formulaire contient des erreurs.', errors);
  if (p.status === 'cancelled' || p.status === 'completed') fail(409, 'Ce projet est clôturé : aucune mise à jour d\'avancement n\'est possible.');
  const previous = { progress: p.progress, phase: p.phase, status: p.status };
  if (body.status && body.status !== p.status) changeStatus(p, body.status, 'Changement de statut lors d\'une mise à jour d\'avancement');
  p.progress = Math.round(progress);
  p.phase = body.phase;
  const at = nowIso();
  p.updatedAt = at;
  p.lastProgressAt = at;
  const u: ProgressUpdate = { id: nextId('PRG'), projectId: p.id, projectTitle: p.title, progress: p.progress, previousProgress: previous.progress, phase: p.phase, previousPhase: previous.phase, status: p.status, previousStatus: previous.status, updateDate: body.updateDate, createdAt: at, note: body.note.trim(), author: ACTOR };
  progressUpdates.push(u);
  return u;
});
mock.get('/renovation/progress-updates', ({ query }) =>
  listQuery(progressUpdates, query, { filters: { projectId: (u) => u.projectId, phase: (u) => u.phase }, searchFields: [(u) => u.projectTitle, (u) => u.note], sorters: { createdAt: (u) => u.createdAt, progress: (u) => u.progress, projectTitle: (u) => u.projectTitle }, defaultSort: { key: 'createdAt', dir: 'desc' } }),
);

// ---- assignments -------------------------------------------------------------------------------------
mock.get('/renovation/projects/:id/assignments', ({ params }) => {
  findProject(params.id);
  return assignments.filter((a) => a.projectId === params.id).sort((a, b) => b.assignedAt.localeCompare(a.assignedAt));
});
mock.post('/renovation/projects/:id/assignments', ({ params, body }) => {
  const p = findProject(params.id);
  if (!body.contractorId) fail(422, 'Sélectionnez une entreprise.', { contractorId: 'required' });
  if (p.status === 'cancelled' || p.status === 'completed') fail(409, 'Ce projet est clôturé : l\'affectation ne peut plus être modifiée.');
  return assignContractor(p, body.contractorId, body.note);
});
mock.get('/renovation/assignments', ({ query }) =>
  listQuery(assignments, { ...query, current: query.current === 'true' ? 'true' : query.current === 'false' ? 'false' : undefined }, {
    searchFields: [(a) => a.projectTitle, (a) => a.contractorName],
    filters: { projectId: (a) => a.projectId, contractorId: (a) => a.contractorId, current: (a) => String(a.current) },
    sorters: { assignedAt: (a) => a.assignedAt, projectTitle: (a) => a.projectTitle, contractorName: (a) => a.contractorName },
    defaultSort: { key: 'assignedAt', dir: 'desc' },
  }),
);

// ---- documents ---------------------------------------------------------------------------------------
mock.get('/renovation/projects/:id/documents', ({ params }) => {
  findProject(params.id);
  return documents.filter((d) => d.projectId === params.id).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
});
mock.post('/renovation/projects/:id/documents', ({ params, body }) => {
  const p = findProject(params.id);
  const file = body instanceof FormData ? (body.get('file') as File | null) : null;
  const category = (body instanceof FormData ? body.get('category') : null) as DocumentCategory | null;
  if (!file || typeof file === 'string') fail(422, 'Aucun fichier reçu.', { file: 'required' });
  if (file!.size > 15 * 1024 * 1024) fail(413, 'Le fichier dépasse la taille maximale autorisée (15 Mo).');
  const d: ProjectDocument = {
    id: nextId('DOC'), projectId: p.id, projectTitle: p.title, name: file!.name, category: category && DOCUMENT_CATEGORIES.includes(category) ? category : 'other', mimeType: file!.type || 'application/octet-stream', size: file!.size,
    uploadedAt: nowIso(), uploadedBy: ACTOR.name, url: URL.createObjectURL(file!), // real object URL → the uploaded file can really be previewed / downloaded in the demo
  };
  documents.push(d);
  p.updatedAt = d.uploadedAt;
  return d;
});
mock.delete('/renovation/documents/:id', ({ params }) => {
  const i = documents.findIndex((d) => d.id === params.id);
  if (i < 0) fail(404, 'Document introuvable');
  documents.splice(i, 1);
  return null;
});
mock.get('/renovation/documents', ({ query }) =>
  listQuery(documents, query, { searchFields: [(d) => d.name, (d) => d.projectTitle], filters: { projectId: (d) => d.projectId, category: (d) => d.category }, sorters: { uploadedAt: (d) => d.uploadedAt, name: (d) => d.name, size: (d) => d.size, projectTitle: (d) => d.projectTitle }, defaultSort: { key: 'uploadedAt', dir: 'desc' } }),
);

// ---- contractors -------------------------------------------------------------------------------------
function validateContractor(b: any, selfId?: string) {
  const errors: Record<string, string> = {};
  for (const f of ['companyName', 'contactPerson', 'email', 'phone', 'address', 'activity']) if (!b[f]?.toString().trim()) errors[f] = 'required';
  if (b.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(b.email)) errors.email = 'Adresse e-mail invalide';
  if (b.companyName && contractors.some((c) => c.id !== selfId && c.companyName.toLowerCase() === b.companyName.trim().toLowerCase())) errors.companyName = 'Une entreprise portant ce nom existe déjà.';
  if (!CONTRACTOR_STATUSES.includes(b.status)) errors.status = 'invalid';
  if (Object.keys(errors).length) fail(422, 'Le formulaire contient des erreurs.', errors);
}
mock.get('/renovation/contractors', ({ query }) => {
  refreshContractorCounts();
  return listQuery(contractors, query, {
    searchFields: [(c) => c.companyName, (c) => c.contactPerson, (c) => c.email, (c) => c.city],
    filters: { status: (c) => c.status, activity: (c) => c.activity },
    sorters: { companyName: (c) => c.companyName, contactPerson: (c) => c.contactPerson, activity: (c) => c.activity, status: (c) => c.status, projectCount: (c) => c.projectCount, city: (c) => c.city },
    defaultSort: { key: 'companyName', dir: 'asc' },
  });
});
mock.get('/renovation/contractors/:id', ({ params }) => { refreshContractorCounts(); return { ...findContractor(params.id) }; });
mock.post('/renovation/contractors', ({ body }) => {
  validateContractor(body);
  const c: Contractor = {
    id: `CTR-${String(contractors.length + 1).padStart(3, '0')}`, companyName: body.companyName.trim(), contactPerson: body.contactPerson.trim(), email: body.email.trim(), phone: body.phone.trim(), address: body.address.trim(), city: body.city?.trim() ?? '', activity: body.activity.trim(),
    registrationNumber: body.registrationNumber?.trim() || undefined, foundedYear: body.foundedYear ? Number(body.foundedYear) : undefined, website: body.website?.trim() || undefined, description: body.description?.trim() || undefined, status: body.status as ContractorStatus,
    projectCount: 0, activeProjectCount: 0, createdAt: nowIso(), updatedAt: nowIso(),
  };
  contractors.push(c);
  return c;
});
mock.put('/renovation/contractors/:id', ({ params, body }) => {
  const c = findContractor(params.id);
  validateContractor(body, c.id);
  Object.assign(c, { companyName: body.companyName.trim(), contactPerson: body.contactPerson.trim(), email: body.email.trim(), phone: body.phone.trim(), address: body.address.trim(), city: body.city?.trim() ?? '', activity: body.activity.trim(), registrationNumber: body.registrationNumber?.trim() || undefined, foundedYear: body.foundedYear ? Number(body.foundedYear) : undefined, website: body.website?.trim() || undefined, description: body.description?.trim() || undefined, status: body.status, updatedAt: nowIso() });
  projects.filter((p) => p.contractorId === c.id).forEach((p) => (p.contractorName = c.companyName));
  assignments.filter((a) => a.contractorId === c.id).forEach((a) => (a.contractorName = c.companyName));
  return { ...c };
});
mock.patch('/renovation/contractors/:id/status', ({ params, body }) => {
  const c = findContractor(params.id);
  if (!CONTRACTOR_STATUSES.includes(body.status)) fail(422, 'Statut invalide', { status: 'invalid' });
  c.status = body.status;
  c.updatedAt = nowIso();
  return { ...c };
});
