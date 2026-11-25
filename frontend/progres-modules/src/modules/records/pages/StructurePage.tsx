import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, Boxes, FolderTree, Layers, Library, Network, Shapes, GraduationCap } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth/AuthContext';
import { PageHeader, Tabs } from '@/components/ui';
import { DomainsTab, FieldsTab, HierarchyTab, ProgramsTab, SemestersTab, SpecialtiesTab, SubjectsTab, UnitsTab } from '../components/structureTabs';

const TABS = ['hierarchy', 'domains', 'fields', 'specialties', 'programs', 'semesters', 'teaching-units', 'subjects'] as const;
type TabId = (typeof TABS)[number];
const tabKey: Record<TabId, string> = { hierarchy: 'rec.tab.hierarchy', domains: 'rec.tab.domains', fields: 'rec.tab.fields', specialties: 'rec.tab.specialties', programs: 'rec.tab.programs', semesters: 'rec.tab.semesters', 'teaching-units': 'rec.tab.teachingUnits', subjects: 'rec.tab.subjects' };
const tabIcon = { hierarchy: FolderTree, domains: Network, fields: Layers, specialties: Shapes, programs: GraduationCap, semesters: Library, 'teaching-units': Boxes, subjects: BookOpen };

export default function StructurePage() {
  const { t } = useI18n();
  const { can } = useAuth();
  const { tab } = useParams();
  const navigate = useNavigate();
  const active: TabId = (TABS as readonly string[]).includes(tab ?? '') ? (tab as TabId) : 'hierarchy';
  return (
    <>
      <PageHeader title={t('rec.structure.title')} subtitle={t('rec.structure.subtitle')} breadcrumbs={[{ label: t('rec.title'), to: '/records' }, { label: t('rec.structure.title') }]} />
      {!can('records.manage') && <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800">{t('state.readOnly')}</p>}
      <Tabs className="mb-5" active={active} onChange={(id) => navigate(`/records/structure/${id}`)} tabs={TABS.map((id) => ({ id, label: t(tabKey[id]), icon: tabIcon[id] }))} />
      <div key={active} className="animate-fade-in">
        {active === 'hierarchy' && <HierarchyTab />}
        {active === 'domains' && <DomainsTab />}
        {active === 'fields' && <FieldsTab />}
        {active === 'specialties' && <SpecialtiesTab />}
        {active === 'programs' && <ProgramsTab />}
        {active === 'semesters' && <SemestersTab />}
        {active === 'teaching-units' && <UnitsTab />}
        {active === 'subjects' && <SubjectsTab />}
      </div>
    </>
  );
}
