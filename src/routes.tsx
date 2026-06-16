import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ROUTES } from './constants';
import { useAuthStore } from './stores';
import { FEATURE_FLAGS } from './config/featureFlags';
import UnderConstructionPage from './pages/under-construction/UnderConstructionPage';

// Layouts
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Pages
import DashboardPage from './pages/dashboard/DashboardPage';
import HouseholdListPage from './pages/household/HouseholdListPage';
import HouseholdCreatePage from './pages/household/HouseholdCreatePage';
import HouseholdDetailPage from './pages/household/HouseholdDetailPage';
import RescueTeamListPage from './pages/rescue-team/RescueTeamListPage';
import RescueTeamDashboardPage from './pages/rescue-team/RescueTeamDashboardPage';
import RescueTeamCreatePage from './pages/rescue-team/RescueTeamCreatePage';
import RescueTeamDetailPage from './pages/rescue-team/RescueTeamDetailPage';
import TeamSpecializationListPage from './pages/rescue-team/TeamSpecializationListPage';
import DisasterListPage from './pages/disaster/DisasterListPage';
import DisasterDetailPage from './pages/disaster/DisasterDetailPage';
import DonationListPage from './pages/donation/DonationListPage';
import DonationCampaignPage from './pages/donation/DonationCampaignPage';
import UserListPage from './pages/categories/UserListPage';
import RoleListPage from './pages/categories/RoleListPage';


// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <>{children}</>;
}

// Public Route Component (redirect to dashboard if logged in)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

// Feature Guard Component (shows under construction page if route is disabled)
function FeatureGuard({ route, children }: { route: string; children: React.ReactNode }) {
  const isEnabled = FEATURE_FLAGS[route];

  if (isEnabled === false) {
    return <UnderConstructionPage />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    path: ROUTES.AUTH,
    element: (
      <PublicRoute>
        <AuthLayout />
      </PublicRoute>
    ),
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: ROUTES.DASHBOARD,
        element: (
          <FeatureGuard route={ROUTES.DASHBOARD}>
            <DashboardPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.HOUSEHOLD_LIST,
        element: (
          <FeatureGuard route={ROUTES.HOUSEHOLD_LIST}>
            <HouseholdListPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.HOUSEHOLD_CREATE,
        element: (
          <FeatureGuard route={ROUTES.HOUSEHOLD_CREATE}>
            <HouseholdCreatePage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.HOUSEHOLD_DETAIL,
        element: (
          <FeatureGuard route={ROUTES.HOUSEHOLD_DETAIL}>
            <HouseholdDetailPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.RESCUE_TEAM_LIST,
        element: (
          <FeatureGuard route={ROUTES.RESCUE_TEAM_LIST}>
            <RescueTeamListPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.RESCUE_TEAM_DASHBOARD,
        element: (
          <FeatureGuard route={ROUTES.RESCUE_TEAM_DASHBOARD}>
            <RescueTeamDashboardPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.RESCUE_TEAM_CREATE,
        element: (
          <FeatureGuard route={ROUTES.RESCUE_TEAM_CREATE}>
            <RescueTeamCreatePage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.RESCUE_TEAM_DETAIL,
        element: (
          <FeatureGuard route={ROUTES.RESCUE_TEAM_DETAIL}>
            <RescueTeamDetailPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.TEAM_SPECIALIZATION_LIST,
        element: (
          <FeatureGuard route={ROUTES.TEAM_SPECIALIZATION_LIST}>
            <TeamSpecializationListPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.DISASTER_LIST,
        element: (
          <FeatureGuard route={ROUTES.DISASTER_LIST}>
            <DisasterListPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.DISASTER_DETAIL,
        element: (
          <FeatureGuard route={ROUTES.DISASTER_DETAIL}>
            <DisasterDetailPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.DONATION_LIST,
        element: (
          <FeatureGuard route={ROUTES.DONATION_LIST}>
            <DonationListPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.DONATION_CAMPAIGN,
        element: (
          <FeatureGuard route={ROUTES.DONATION_CAMPAIGN}>
            <DonationCampaignPage />
          </FeatureGuard>
        ),
      },
      {
        path: ROUTES.USER_LIST,
        element: <UserListPage />,
      },
      {
        path: ROUTES.ROLE_LIST,
        element: <RoleListPage />,
      },
    ],
  },
]);
