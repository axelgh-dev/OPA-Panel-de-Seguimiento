import { Navigate, createBrowserRouter, type RouteObject } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { InitialFallback } from './InitialFallback'

/** Cada página se descarga solo al visitarla (code splitting por ruta). */
const routes: RouteObject[] = [
  {
    path: '/login',
    HydrateFallback: InitialFallback,
    lazy: async () => ({ Component: (await import('@/features/auth/LoginPage')).LoginPage }),
  },
  {
    element: <AppLayout />,
    HydrateFallback: InitialFallback,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('@/features/dashboard/DashboardPage')).DashboardPage,
        }),
      },
      // El dashboard ya es la lista de proyectos; /proyectos redirige ahí (ver SUPUESTO en Sidebar).
      { path: 'proyectos', element: <Navigate to="/" replace /> },
      {
        path: 'proyectos/:slug',
        lazy: async () => ({
          Component: (await import('@/features/projects/ProjectDetailPage')).ProjectDetailPage,
        }),
      },
      {
        path: 'bitacora',
        lazy: async () => ({
          Component: (await import('@/features/updates/GlobalUpdatesPage')).GlobalUpdatesPage,
        }),
      },
      {
        path: 'solicitudes',
        lazy: async () => ({
          Component: (await import('@/features/change-requests/GlobalChangeRequestsPage'))
            .GlobalChangeRequestsPage,
        }),
      },
      {
        path: 'admin/usuarios',
        lazy: async () => ({
          Component: (await import('@/features/admin/AdminUsersPage')).AdminUsersPage,
        }),
      },
      {
        path: '*',
        lazy: async () => ({ Component: (await import('./NotFoundPage')).NotFoundPage }),
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
