import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'
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

const schema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Escribe tu correo.')
    .email('Revisa que el correo esté completo, por ejemplo nombre@despacho.mx.'),
  password: z.string().min(1, 'Escribe tu contraseña.'),
})

/** Solo visual: no hay autenticación real hasta la fase 2. */
export function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <main className="w-full max-w-sm">
        <img
          src="/brand/logo.png"
          alt="OP&A Business and Tax Consultants"
          className="mx-auto mb-8 h-auto w-52"
        />
        <div className="rounded-xl border bg-card p-6 shadow-card sm:p-8">
          <h1 className="text-2xl">Panel de seguimiento</h1>
          <p className="mt-1 text-muted-foreground">
            Inicia sesión para ver el avance de tus proyectos.
          </p>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(() => navigate('/'))}
              className="mt-6 space-y-4"
              noValidate
            >
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
              <Button type="submit" className="w-full">
                Entrar
              </Button>
              <p className="text-center text-sm">
                <button
                  type="button"
                  className="rounded text-primary hover:underline"
                  onClick={() => undefined}
                >
                  Olvidé mi contraseña
                </button>
              </p>
            </form>
          </Form>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Maqueta de concepto: con cualquier correo y contraseña entras al panel.
        </p>
      </main>
    </div>
  )
}
