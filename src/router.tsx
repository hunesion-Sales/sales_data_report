import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import { LoadingSpinner } from './components/error';

// 항상 로드 (초기 화면)
import SolutionBusinessDashboard from './components/SolutionBusinessDashboard';

// Lazy load — 일반 사용자 페이지
const DataInputPage = lazy(() => import('./pages/DataInputPage'));
const DivisionReportPage = lazy(() => import('./pages/DivisionReportPage'));
const ProductReportPage = lazy(() => import('./pages/ProductReportPage'));
const AchievementPage = lazy(() => import('./pages/AchievementPage'));

// Lazy load — 관리자 전용 페이지
const DivisionManagementPage = lazy(() => import('./pages/admin/DivisionManagementPage'));
const ProductManagementPage = lazy(() => import('./pages/admin/ProductManagementPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const TargetInputPage = lazy(() => import('./pages/admin/TargetInputPage'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingSpinner size="lg" message="페이지를 불러오는 중..." />}>
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/',
        element: <SolutionBusinessDashboard />,
      },
      {
        path: '/input',
        element: (
          <SuspenseWrapper>
            <DataInputPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/reports',
        element: (
          <SuspenseWrapper>
            <DivisionReportPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/product-reports',
        element: (
          <SuspenseWrapper>
            <ProductReportPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/achievement',
        element: (
          <SuspenseWrapper>
            <AchievementPage />
          </SuspenseWrapper>
        ),
      },
      {
        path: '/admin/divisions',
        element: (
          <ProtectedRoute adminOnly>
            <SuspenseWrapper>
              <DivisionManagementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/products',
        element: (
          <ProtectedRoute adminOnly>
            <SuspenseWrapper>
              <ProductManagementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute adminOnly>
            <SuspenseWrapper>
              <UserManagementPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/targets',
        element: (
          <ProtectedRoute adminOnly>
            <SuspenseWrapper>
              <TargetInputPage />
            </SuspenseWrapper>
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
