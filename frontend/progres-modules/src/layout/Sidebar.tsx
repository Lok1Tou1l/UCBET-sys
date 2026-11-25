import { NavLink } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n';
import { useAuth } from '@/auth/AuthContext';
import { footerItems, homeItem, navSections, type NavItem } from './navigation';

function Item({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const { t } = useI18n();
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-4 px-6 py-[9px] text-[15px] font-medium transition-colors duration-150',
          isActive ? 'rounded-e-xl bg-brand-600 text-white' : 'text-white/80 hover:bg-white/8 hover:text-white',
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0 opacity-90" />
      <span className="truncate">{t(item.labelKey)}</span>
    </NavLink>
  );
}

function CampusIllustration() {
  return (
    <svg viewBox="0 0 220 90" className="h-auto w-full text-white/15" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
      <path d="M10 86h200M30 86V52h160v34M50 52v34M80 52v34M110 52v34M140 52v34M170 52v34" />
      <path d="M20 52 110 22l90 30M95 40l15-10 15 10M110 22V8m0 0 10 4-10 4" />
      <rect x="96" y="62" width="28" height="24" rx="2" />
      <path d="M60 66h10M150 66h10M60 74h10M150 74h10" />
    </svg>
  );
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useI18n();
  const { can } = useAuth();
  return (
    <div className="flex h-full flex-col bg-[#13264f] text-white">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-5">
        <span className="flex h-11 w-11 items-center justify-center">
          <GraduationCap className="h-7 w-7" />
        </span>
        <div className="leading-tight">
          <p className="text-lg font-extrabold tracking-tight">{t('app.name')}</p>
          <p className="text-xs text-navy-200">{t('app.tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto py-3 pe-2" aria-label="main">
        <Item item={homeItem} onNavigate={onNavigate} />
        {navSections
          .filter((s) => can(s.permission))
          .map((s) => (
            <div key={s.id}>
              <NavLink to={s.to} end onClick={onNavigate} className={({ isActive }) => cn('mb-1 block px-6 text-[15.5px] font-bold transition-colors hover:text-white', isActive ? 'text-white' : 'text-white/95')}>
                {t(s.titleKey)}
              </NavLink>
              <div className="space-y-0.5">
                {s.items.map((it) => (
                  <Item key={it.to} item={it} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          ))}
      </nav>

      <div className="border-t border-white/10 py-3 pe-2">
        <div className="space-y-0.5">
          {footerItems.map((it) => (
            <Item key={it.to} item={it} onNavigate={onNavigate} />
          ))}
        </div>
        <div className="mt-2 hidden px-6 pb-1 min-[1000px]:block">
          <CampusIllustration />
        </div>
      </div>
    </div>
  );
}
