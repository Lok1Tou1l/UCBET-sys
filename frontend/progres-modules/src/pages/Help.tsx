import { ClipboardList, GraduationCap, HardHat, Lightbulb } from 'lucide-react';
import { useI18n } from '@/i18n';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui';

export default function Help() {
  const { t } = useI18n();
  const mods = [
    { icon: ClipboardList, title: t('nav.section.admissions'), text: t('help.admissions'), cls: 'bg-brand-600' },
    { icon: GraduationCap, title: t('nav.section.records'), text: t('help.records'), cls: 'bg-emerald-500' },
    { icon: HardHat, title: t('nav.section.renovation'), text: t('help.renovation'), cls: 'bg-orange-500' },
  ];
  return (
    <>
      <PageHeader title={t('help.title')} subtitle={t('help.subtitle')} breadcrumbs={[{ label: t('help.title') }]} />
      <h2 className="mb-3 text-lg font-bold text-navy-900">{t('help.modules')}</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {mods.map((m) => (
          <Card key={m.title}><CardBody><span className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-white ${m.cls}`}><m.icon className="h-6 w-6" /></span><p className="font-bold text-navy-900">{m.title}</p><p className="mt-1 text-sm text-slate-600">{m.text}</p></CardBody></Card>
        ))}
      </div>
      <Card className="mt-6">
        <CardHeader title={t('help.tips')} icon={Lightbulb} />
        <CardBody><ul className="list-disc space-y-2 ps-5 text-sm text-slate-600">{['help.tip1', 'help.tip2', 'help.tip3'].map((k) => <li key={k}>{t(k)}</li>)}</ul></CardBody>
      </Card>
    </>
  );
}
