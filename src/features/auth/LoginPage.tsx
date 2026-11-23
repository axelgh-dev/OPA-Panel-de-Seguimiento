import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { auth, dataMode } from '@/data'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { AuthCard } from './AuthCard'

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo.')
    .email('Revisa que el correo esté completo, por ejemplo nombre@despacho.mx.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})
type Values = z.infer<typeof schema>

export function LoginPage() {
  return dataMode === 'supabase' ? <SupabaseLogin /> : <DemoLogin />
}

/** Demo: no hay autenticación real; con cualquier correo y contraseña se entra. */
function DemoLogin() {
  const navigate = useNavigate()
  return (
    <AuthCard
      title="Panel de seguimiento"
      description="Inicia sesión para ver el avance de tus proyectos."
      footer="Maqueta de concepto: con cualquier correo y contraseña entras al panel."
    >
      <LoginForm onSubmit={() => navigate('/')} forgotTo={null} />
    </AuthCard>
  )
}

function SupabaseLogin() {
  const { status, refresh } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  if (status === 'authenticated') return <Navigate to={from} replace />

  async function onSubmit(values: Values) {
    await auth!.signIn(values.email, values.password)
    await refresh()
    navigate(from, { replace: true })
  }

  return (
    <AuthCard
      title="Panel de seguimiento"
      description="Inicia sesión para ver el avance de tus proyectos."
    >
      <LoginForm onSubmit={onSubmit} forgotTo="/recuperar" />
    </AuthCard>
  )
}

function LoginForm({
  onSubmit,
  forgotTo,
}: {
  onSubmit: (values: Values) => void | Promise<void>
  forgotTo: string | null
}) {
  const [error, setError] = useState<string | null>(null)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  async function submit(values: Values) {
    setError(null)
    try {
      await onSubmit(values)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos iniciar sesión. Intenta de nuevo.')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(submit)} className="mt-6 space-y-4" noValidate>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo electrónico</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="nombre@despacho.mx"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && (
          <p role="alert" className="text-sm text-danger-ink">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
        {forgotTo && (
          <p className="text-center text-sm">
            <Link to={forgotTo} className="rounded text-primary hover:underline">
              Olvidé mi contraseña
            </Link>
          </p>
        )}
      </form>
    </Form>
  )
}
