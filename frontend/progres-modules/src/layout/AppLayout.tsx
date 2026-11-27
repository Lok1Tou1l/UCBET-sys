import { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { PageSkeleton } from '@/components/ui';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export function AppLayout() {
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f0f4fd]">
      {/* desktop sidebar */}
      <aside className={`fixed inset-y-0 start-0 z-40 hidden w-[270px] transition-transform duration-300 ${collapsed ? '-translate-x-full rtl:translate-x-full' : ''} lg:block`}>
        <Sidebar />
      </aside>

      {/* mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-navy-950/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[280px] animate-slide-in-start rtl:animate-slide-in-end" aria-label={t('nav.openMenu')}>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={`transition-[padding] duration-300 ${collapsed ? '' : 'lg:ps-[270px]'}`}>
        <Topbar onMenu={() => (window.matchMedia('(min-width: 1024px)').matches ? setCollapsed((c) => !c) : setMobileOpen(true))} />
        <main className="mx-auto max-w-[1500px] px-4 py-6 lg:px-8 lg:py-8">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
