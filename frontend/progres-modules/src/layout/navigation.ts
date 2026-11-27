import {
  BookOpenCheck,
  Building2,
  ClipboardList,
  FileText,
  FolderOpen,
  Gavel,
  GraduationCap,
  HardHat,
  Home,
  Inbox,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  UserCheck,
  Users,
  Wrench,
  HelpCircle,
  Activity,
  Handshake,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/auth/AuthContext';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  end?: boolean;
}
export interface NavSection {
  id: string;
  titleKey: string;
  /** the section heading links to the module dashboard */
  to: string;
  permission: Permission;
  items: NavItem[];
}

export const homeItem: NavItem = { to: '/', labelKey: 'nav.dashboard', icon: Home, end: true };

/** Mirrors the reference design: Home + 3 sections + Settings/Help. Module dashboards open from the section headings. */
export const navSections: NavSection[] = [
  {
    id: 'admissions',
    titleKey: 'nav.section.admissions',
    to: '/admissions',
    permission: 'admissions.view',
    items: [
      { to: '/admissions/applications', labelKey: 'nav.adm.queue', icon: Inbox },
      { to: '/admissions/registrations', labelKey: 'nav.adm.registrations', icon: UserCheck },
      { to: '/admissions/decisions', labelKey: 'nav.adm.decisions', icon: Gavel },
    ],
  },
  {
    id: 'records',
    titleKey: 'nav.section.records',
    to: '/records',
    permission: 'records.view',
    items: [
      { to: '/records/structure', labelKey: 'nav.rec.structure', icon: Network },
      { to: '/records/students', labelKey: 'nav.rec.students', icon: Search },
      { to: '/records/files', labelKey: 'nav.rec.files', icon: FolderOpen },
      { to: '/records/results', labelKey: 'nav.rec.results', icon: BookOpenCheck },
    ],
  },
  {
    id: 'renovation',
    titleKey: 'nav.section.renovation',
    to: '/renovation',
    permission: 'renovation.view',
    items: [
      { to: '/renovation/projects', labelKey: 'nav.ren.projects', icon: Wrench },
      { to: '/renovation/contractors', labelKey: 'nav.ren.contractors', icon: Building2 },
      { to: '/renovation/progress', labelKey: 'nav.ren.progress', icon: Activity },
      { to: '/renovation/documents', labelKey: 'nav.ren.documents', icon: FileText },
    ],
  },
];

export const footerItems: NavItem[] = [
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
  { to: '/help', labelKey: 'nav.help', icon: HelpCircle },
];

// re-exported so modules can reuse icon choices
export const moduleIcons = { admissions: ClipboardList, records: GraduationCap, renovation: HardHat, students: Users, files: FolderOpen };
