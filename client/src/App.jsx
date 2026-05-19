import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ToastProvider from './components/ToastProvider';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import GetStarted from './pages/GetStarted';
import ChangePassword from './pages/ChangePassword';
import PassportList from './pages/PassportList';
import PassportDetail from './pages/PassportDetail';
import CandidateList from './pages/CandidateList';
import DirectoryPage from './pages/DirectoryPage';
import StaffPage from './pages/StaffPage';
import SponsorPage from './pages/SponsorPage';
import DemandList from './pages/DemandList';
import DemandDetail from './pages/DemandDetail';
import Finance from './pages/Finance';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import SetPasswordPage from './pages/SetPasswordPage';
import NotFound from './pages/NotFound';
import CandidateWorkspacePage from './pages/CandidateWorkspacePage';
import TodayDashboard from './pages/TodayDashboard';
import GulfVisaBoard from './pages/GulfVisaBoard';
import MalaysiaPlksBoard from './pages/MalaysiaPlksBoard';
import MedicalBoard from './pages/MedicalBoard';
import OrientationBoard from './pages/OrientationBoard';
import DepartedCandidates from './pages/DepartedCandidates';

const PassportScanner = lazy(() => import('./components/modules/PassportScanner'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const AgencyManagement = lazy(() => import('./pages/AgencyManagement'));
const FeimsSubmissionCenter = lazy(() => import('./pages/FeimsSubmissionCenter'));
const PrintBiodata = lazy(() => import('./pages/print/PrintBiodata'));
const PrintFeimsPacket = lazy(() => import('./pages/print/PrintFeimsPacket'));
const PrintDeparture = lazy(() => import('./pages/print/PrintDeparture'));
const PrintCV = lazy(() => import('./pages/print/PrintCV'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const V2CandidateRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/candidates/${id}`} replace />;
};

const App = () => {
  const { user, loading } = useAuth();
  return (
    <>
      <ToastProvider />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route
          path="/register"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <TodayDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates"
          element={
            <ProtectedRoute>
              <Layout>
                <CandidateList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CandidateWorkspacePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Legacy alias — keep redirecting until external links/bookmarks die out */}
        <Route path="/v2/candidates/:id" element={<V2CandidateRedirect />} />
        <Route
          path="/departed"
          element={
            <ProtectedRoute>
              <Layout>
                <DepartedCandidates />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feims"
          element={
            <ProtectedRoute>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <FeimsSubmissionCenter />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gulf/visa-board"
          element={
            <ProtectedRoute>
              <Layout>
                <GulfVisaBoard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/malaysia/plks-board"
          element={
            <ProtectedRoute>
              <Layout>
                <MalaysiaPlksBoard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/medical-board"
          element={
            <ProtectedRoute>
              <Layout>
                <MedicalBoard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orientation-board"
          element={
            <ProtectedRoute>
              <Layout>
                <OrientationBoard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/directory"
          element={<Navigate to="/directory/staff" replace />}
        />
        <Route
          path="/directory/staff"
          element={
            <ProtectedRoute>
              <Layout>
                <StaffPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/directory/agents"
          element={
            <ProtectedRoute>
              <Layout>
                <SponsorPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/passports"
          element={
            <ProtectedRoute>
              <Layout>
                <PassportList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/passports/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <PassportDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/passport/scanner"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageLoader />}>
                <PassportScanner />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/demands"
          element={
            <ProtectedRoute>
              <Layout>
                <DemandList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/demands/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <DemandDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance"
          element={
            <ProtectedRoute>
              <Layout>
                <Finance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Layout>
                <Alerts />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute>
              <Layout>
                <Documents />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <Layout>
                <Tasks />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Super Admin Routes */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <SuperAdminDashboard />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/agencies"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <AgencyManagement />
                </Suspense>
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Print routes — no Layout wrapper, just auth */}
        <Route
          path="/print/biodata/:candidateId"
          element={<ProtectedRoute><Suspense fallback={<PageLoader />}><PrintBiodata /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/print/feims-packet/:candidateId"
          element={<ProtectedRoute><Suspense fallback={<PageLoader />}><PrintFeimsPacket /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/print/departure/:candidateId"
          element={<ProtectedRoute><Suspense fallback={<PageLoader />}><PrintDeparture /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/print/cv/:candidateId"
          element={<ProtectedRoute><Suspense fallback={<PageLoader />}><PrintCV /></Suspense></ProtectedRoute>}
        />
        <Route
          path="/"
          element={
            loading ? null
              : user
                ? <Navigate to={user.role === 'superadmin' ? '/superadmin/dashboard' : '/candidates'} replace />
                : <LandingPage />
          }
        />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Layout>
                <NotFound />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;