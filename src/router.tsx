import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SolutionBusinessDashboard from './components/SolutionBusinessDashboard';
import DivisionReportPage from './pages/DivisionReportPage';
import DivisionManagementPage from './pages/admin/DivisionManagementPage';
import ProductManagementPage from './pages/admin/ProductManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';

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
    path: '/',
    element: (
      <ProtectedRoute>
        <SolutionBusinessDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <DivisionReportPage />
      </ProtectedRoute>
    ),
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
]);
