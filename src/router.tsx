import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SolutionBusinessDashboard from './components/SolutionBusinessDashboard';
import DivisionReportPage from './pages/DivisionReportPage';
import AchievementPage from './pages/AchievementPage';
import DivisionManagementPage from './pages/admin/DivisionManagementPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import TargetInputPage from './pages/admin/TargetInputPage';
import MainLayout from './components/layout/MainLayout';
import DataInputPage from './pages/DataInputPage';
import ProductReportPage from './pages/ProductReportPage';

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
        element: <DataInputPage />,
      },
      {
        path: '/reports',
        element: <DivisionReportPage />,
      },
      {
        path: '/product-reports',
        element: <ProductReportPage />,
      },
      {
        path: '/achievement',
        element: <AchievementPage />,
      },
      {
        path: '/admin/divisions',
        element: (
          <ProtectedRoute adminOnly>
            <DivisionManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/products',
        element: (
          <ProtectedRoute adminOnly>
            <ProductManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute adminOnly>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/admin/targets',
        element: (
          <ProtectedRoute adminOnly>
            <TargetInputPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
