import { Navigate, createBrowserRouter } from 'react-router-dom'
import { AdminUsersPage } from '@/features/admin/AdminUsersPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { GlobalChangeRequestsPage } from '@/features/change-requests/GlobalChangeRequestsPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ProjectDetailPage } from '@/features/projects/ProjectDetailPage'
import { GlobalUpdatesPage } from '@/features/updates/GlobalUpdatesPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'

export const routes = [
  { path: '/login', element: <LoginPage /> },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      // SUPUESTO: el dashboard ya es la lista de proyectos.
      { path: 'proyectos', element: <Navigate to="/" replace /> },
      { path: 'proyectos/:slug', element: <ProjectDetailPage /> },
      { path: 'bitacora', element: <GlobalUpdatesPage /> },
      { path: 'solicitudes', element: <GlobalChangeRequestsPage /> },
      { path: 'admin/usuarios', element: <AdminUsersPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const router = createBrowserRouter(routes)
