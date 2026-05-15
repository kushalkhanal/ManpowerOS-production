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
import PassportScanner from './components/modules/PassportScanner';
import CandidateList from './pages/CandidateList';
import DirectoryPage from './pages/DirectoryPage';
import DemandList from './pages/DemandList';
import DemandDetail from './pages/DemandDetail';
import Finance from './pages/Finance';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import AgencyManagement from './pages/AgencyManagement';
import SetPasswordPage from './pages/SetPasswordPage';
import NotFound from './pages/NotFound';
import CandidateWorkspacePage from './pages/v2/CandidateWorkspacePage';
import FeimsSubmissionCenter from './pages/v2/FeimsSubmissionCenter';
import TodayDashboard from './pages/v2/TodayDashboard';
import GulfVisaBoard from './pages/v2/GulfVisaBoard';
import MalaysiaPlksBoard from './pages/v2/MalaysiaPlksBoard';
import MedicalBoard from './pages/v2/MedicalBoard';
import OrientationBoard from './pages/v2/OrientationBoard';
import PrintBiodata from './pages/v2/print/PrintBiodata';
import PrintFeimsPacket from './pages/v2/print/PrintFeimsPacket';
import PrintDeparture from './pages/v2/print/PrintDeparture';

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
          path="/feims"
          element={
            <ProtectedRoute>
              <Layout>
                <FeimsSubmissionCenter />
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
          element={
            <ProtectedRoute>
              <Layout>
                <DirectoryPage />
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
              <PassportScanner />
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
                <SuperAdminDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/agencies"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <Layout>
                <AgencyManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        {/* Print routes — no Layout wrapper, just auth */}
        <Route
          path="/print/biodata/:candidateId"
          element={<ProtectedRoute><PrintBiodata /></ProtectedRoute>}
        />
        <Route
          path="/print/feims-packet/:candidateId"
          element={<ProtectedRoute><PrintFeimsPacket /></ProtectedRoute>}
        />
        <Route
          path="/print/departure/:candidateId"
          element={<ProtectedRoute><PrintDeparture /></ProtectedRoute>}
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