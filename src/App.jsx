import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppLayout from '@/components/AppLayout';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import Dashboard from '@/pages/Dashboard';
import DiscoverTeams from '@/pages/DiscoverTeams';
import DiscoverParticipants from '@/pages/DiscoverParticipants';
import Profile from '@/pages/Profile';
import TeamDetails from '@/pages/TeamDetails';
import CreateTeam from '@/pages/CreateTeam';
import EditTeam from '@/pages/EditTeam';
import MyTeams from '@/pages/MyTeams';
import Requests from '@/pages/Requests';
import Notifications from '@/pages/Notifications';
import TeamWorkspace from '@/pages/TeamWorkspace';
import Settings from '@/pages/Settings';
import OAuthConsent from '@/pages/OAuthConsent';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Landing />} />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/teams" element={<DiscoverTeams />} />
          <Route path="/participants" element={<DiscoverParticipants />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/team/:id" element={<TeamDetails />} />
          <Route path="/teams/create" element={<CreateTeam />} />
          <Route path="/team/:id/edit" element={<EditTeam />} />
          <Route path="/my-teams" element={<MyTeams />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/workspace/:id" element={<TeamWorkspace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
