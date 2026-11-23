import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { auth } from '@/data'
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

const schema = z
  .object({
    password: z.string().min(8, 'Usa al menos 8 caracteres.').max(72, 'Máximo 72 caracteres.'),
    confirm: z.string().min(1, 'Repite la contraseña.'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Las contraseñas no coinciden.',
  })

/**
 * Destino del enlace del correo de recuperación: Supabase abre una sesión temporal y aquí se fija la nueva contraseña.
 * También sirve a un usuario con sesión que quiera cambiarla.
 */
export function ResetPasswordPage() {
  const { status, refresh } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirm: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null)
    try {
      await auth!.updatePassword(values.password)
      await refresh()
      navigate('/', { replace: true })
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'No pudimos cambiar la contraseña. Intenta de nuevo.',
      )
    }
  }

  if (status === 'loading') {
    return (
      <AuthCard title="Nueva contraseña" description="Verificando tu enlace…">
        <span role="status" className="sr-only">
          Cargando
        </span>
      </AuthCard>
    )
  }

  if (status === 'anonymous') {
    return (
      <AuthCard
        title="Enlace no válido"
        description="El enlace para restablecer tu contraseña venció o ya se usó."
      >
        <Link
          to="/recuperar"
          className="mt-6 block text-center text-sm text-primary hover:underline"
        >
          Pedir un enlace nuevo
        </Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Nueva contraseña" description="Elige una contraseña de al menos 8 caracteres.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña nueva</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repite la contraseña</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
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
            {form.formState.isSubmitting ? 'Guardando…' : 'Guardar contraseña'}
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
