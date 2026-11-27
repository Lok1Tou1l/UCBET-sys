import { Bell, CalendarCheck, ClipboardList, FileText, GraduationCap, Home, Upload, UserCog, Users, Activity, type LucideIcon } from "lucide-react";
import type { Role } from "@/types";

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
  /** omit = every authenticated user */
  roles?: Role[];
}

export interface NavSection {
  id: string;
  titleKey: string;
  items: NavItem[];
}

export const homeItem: NavItem = { to: "/dashboard", labelKey: "nav.dashboard", icon: Home };

// Sections mirror progres-modules/src/layout/navigation.ts: a section heading + icon items.
export const navSections: NavSection[] = [
  {
    id: "student",
    titleKey: "nav.section.student",
    items: [
      { to: "/student/application", labelKey: "nav.stu.application", icon: ClipboardList, roles: ["student"] },
      { to: "/student/documents", labelKey: "nav.stu.documents", icon: FileText, roles: ["student"] },
      { to: "/student/status", labelKey: "nav.stu.status", icon: Activity, roles: ["student"] },
      { to: "/student/certificate", labelKey: "nav.stu.certificate", icon: GraduationCap, roles: ["student"] },
      { to: "/student/re-enrollment", labelKey: "nav.stu.reenrollment", icon: CalendarCheck, roles: ["student"] },
      { to: "/notifications", labelKey: "nav.notifications", icon: Bell, roles: ["student"] },
    ],
  },
  {
    id: "iam",
    titleKey: "nav.section.iam",
    items: [
      { to: "/admin/users", labelKey: "nav.iam.users", icon: Users, roles: ["sys_admin"] },
      { to: "/admin/import", labelKey: "nav.iam.import", icon: Upload, roles: ["sys_admin"] },
    ],
  },
];

export const footerItems: NavItem[] = [{ to: "/profile", labelKey: "nav.profile", icon: UserCog }];

export function sectionsForRole(role: string): NavSection[] {
  return navSections
    .map((s) => ({ ...s, items: s.items.filter((i) => !i.roles || (i.roles as string[]).includes(role)) }))
    .filter((s) => s.items.length > 0);
}
