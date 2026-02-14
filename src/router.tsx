import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SolutionBusinessDashboard from './components/SolutionBusinessDashboard';

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
  // TODO: Phase 6+ 추가 라우트
  // {
  //   path: '/admin/divisions',
  //   element: (
  //     <ProtectedRoute adminOnly>
  //       <DivisionManagementPage />
  //     </ProtectedRoute>
  //   ),
  // },
  // {
  //   path: '/admin/users',
  //   element: (
  //     <ProtectedRoute adminOnly>
  //       <UserManagementPage />
  //     </ProtectedRoute>
  //   ),
  // },
]);
