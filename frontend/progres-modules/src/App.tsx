import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/layout/AppLayout';
import { RequirePermission } from '@/auth/RequirePermission';
import { NotFound } from '@/components/ui';

const Home = lazy(() => import('@/pages/Home'));
const Settings = lazy(() => import('@/pages/Settings'));
const Help = lazy(() => import('@/pages/Help'));

const AdmissionsDashboard = lazy(() => import('@/modules/admissions/pages/AdmissionsDashboard'));
const ApplicationQueue = lazy(() => import('@/modules/admissions/pages/ApplicationQueue'));
const ApplicationDetailPage = lazy(() => import('@/modules/admissions/pages/ApplicationDetailPage'));
const Registrations = lazy(() => import('@/modules/admissions/pages/Registrations'));
const Decisions = lazy(() => import('@/modules/admissions/pages/Decisions'));

const RecordsDashboard = lazy(() => import('@/modules/records/pages/RecordsDashboard'));
const StructurePage = lazy(() => import('@/modules/records/pages/StructurePage'));
const ProgramDetailPage = lazy(() => import('@/modules/records/pages/ProgramDetailPage'));
const StudentSearch = lazy(() => import('@/modules/records/pages/StudentSearch'));
const StudentFiles = lazy(() => import('@/modules/records/pages/StudentFiles'));
const StudentFilePage = lazy(() => import('@/modules/records/pages/StudentFilePage'));
const ResultsPage = lazy(() => import('@/modules/records/pages/ResultsPage'));

const RenovationDashboard = lazy(() => import('@/modules/renovation/pages/RenovationDashboard'));
const ProjectList = lazy(() => import('@/modules/renovation/pages/ProjectList'));
const ProjectFormPage = lazy(() => import('@/modules/renovation/pages/ProjectFormPage'));
const ProjectDetailPage = lazy(() => import('@/modules/renovation/pages/ProjectDetailPage'));
const ContractorDirectory = lazy(() => import('@/modules/renovation/pages/ContractorDirectory'));
const ContractorProfile = lazy(() => import('@/modules/renovation/pages/ContractorProfile'));
const AssignmentsPage = lazy(() => import('@/modules/renovation/pages/AssignmentsPage'));
const ProgressPage = lazy(() => import('@/modules/renovation/pages/ProgressPage'));
const DocumentsPage = lazy(() => import('@/modules/renovation/pages/DocumentsPage'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Home />} />

        <Route path="admissions" element={<RequirePermission permission="admissions.view" />}>
          <Route index element={<AdmissionsDashboard />} />
          <Route path="applications" element={<ApplicationQueue />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="registrations" element={<Registrations />} />
          <Route path="decisions" element={<Decisions />} />
        </Route>

        <Route path="records" element={<RequirePermission permission="records.view" />}>
          <Route index element={<RecordsDashboard />} />
          <Route path="structure" element={<StructurePage />} />
          <Route path="structure/programs/:id" element={<ProgramDetailPage />} />
          <Route path="structure/:tab" element={<StructurePage />} />
          <Route path="students" element={<StudentSearch />} />
          <Route path="students/:id" element={<StudentFilePage />} />
          <Route path="files" element={<StudentFiles />} />
          <Route path="results" element={<ResultsPage />} />
        </Route>

        <Route path="renovation" element={<RequirePermission permission="renovation.view" />}>
          <Route index element={<RenovationDashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<ProjectFormPage />} />
          <Route path="projects/:id" element={<ProjectDetailPage />} />
          <Route path="projects/:id/edit" element={<ProjectFormPage />} />
          <Route path="contractors" element={<ContractorDirectory />} />
          <Route path="contractors/:id" element={<ContractorProfile />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="documents" element={<DocumentsPage />} />
        </Route>

        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<Help />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
