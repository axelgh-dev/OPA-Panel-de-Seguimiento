import { zodResolver } from '@hookform/resolvers/zod'
import { MailCheck } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
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
import { AuthCard } from './AuthCard'

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo.')
    .email('Revisa que el correo esté completo, por ejemplo nombre@despacho.mx.'),
})

/** Pide el correo de recuperación. Siempre responde igual para no revelar qué correos existen. */
export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null)
    try {
      await auth!.requestPasswordReset(values.email)
      setSent(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar el correo. Intenta de nuevo.')
    }
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Te enviaremos un enlace para crear una contraseña nueva."
    >
      {sent ? (
        <div role="status" className="mt-6 space-y-4">
          <p className="flex gap-2 text-sm">
            <MailCheck
              aria-hidden
              className="mt-0.5 h-5 w-5 shrink-0 text-success-ink"
              strokeWidth={1.5}
            />
            Si ese correo tiene una cuenta, en unos minutos recibirás un enlace para restablecer tu
            contraseña. Revisa también la carpeta de spam.
          </p>
          <Link to="/login" className="block text-center text-sm text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
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
            {error && (
              <p role="alert" className="text-sm text-danger-ink">
                {error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enviando…' : 'Enviar enlace'}
            </Button>
            <p className="text-center text-sm">
              <Link to="/login" className="rounded text-primary hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
          </form>
        </Form>
      )}
    </AuthCard>
  )
}
