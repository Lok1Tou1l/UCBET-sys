import { Globe, Server, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useAuth, ROLES } from '@/auth/AuthContext';
import { API_BASE_URL, USE_MOCK } from '@/services/http';
import { Badge, Card, CardBody, CardHeader, DescriptionList, PageHeader, SelectField } from '@/components/ui';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { role, setRole } = useAuth();
  return (
    <>
      <PageHeader title={t('settings.title')} subtitle={t('settings.subtitle')} breadcrumbs={[{ label: t('settings.title') }]} />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title={t('settings.language')} icon={Globe} />
          <CardBody>
            <SelectField label={t('settings.language')} value={lang} onChange={(e) => setLang(e.target.value as 'fr' | 'ar')} options={[{ value: 'fr', label: 'Français' }, { value: 'ar', label: 'العربية' }]} hint={t('settings.languageHint')} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t('settings.role')} icon={ShieldCheck} />
          <CardBody>
            <SelectField label={t('settings.role')} value={role} onChange={(e) => setRole(e.target.value as any)} options={ROLES.map((r) => ({ value: r, label: t(`role.${r}`) }))} hint={t('settings.roleHint')} />
          </CardBody>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader title={t('settings.api')} icon={Server} />
          <CardBody>
            <DescriptionList items={[
              { label: t('settings.apiMode'), value: <Badge tone={USE_MOCK ? 'amber' : 'green'}>{USE_MOCK ? t('settings.mock') : t('settings.real')}</Badge> },
              { label: t('settings.apiBase'), value: <span className="ltr-text font-mono">{API_BASE_URL}</span> },
            ]} />
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t('settings.apiHint')}</p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
