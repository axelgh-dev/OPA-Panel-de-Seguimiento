# Desarrollo local con Supabase (Docker)

Requisitos: Node 20+ y Docker Desktop encendido. No toca ningún proyecto de Supabase en la nube.

```bash
npm install
npm run db:start      # levanta Postgres, Auth, Storage y correo local; aplica supabase/migrations
npm run db:seed       # 4 usuarios de prueba + los 5 proyectos de ejemplo (solo contra localhost)
npm run db:test       # pruebas de RLS (supabase/tests/rls.sql)
```

`.env.local` (ignorado por git) para usar la base local:

```
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<ANON_KEY que imprime `npx supabase status`>
```

Luego `npm run dev` y abre http://127.0.0.1:5173.

## Usuarios de prueba

Contraseña común: `Opa-local-2026`

| Rol | Correo |
|---|---|
| dev | `axel@local.test` |
| opa | `admin@local.test` |
| opa | `ejecutivo1@local.test` |
| opa | `ejecutivo2@local.test` |

El correo de recuperación de contraseña llega al buzón local: http://127.0.0.1:54324 (Mailpit).

## Comandos útiles

- `npm run db:reset`: borra y recrea la base desde las migraciones (después hay que volver a correr `db:seed`).
- `npm run db:types`: regenera `src/data/supabase/database.types.ts` tras cambiar el esquema.
- Modo demo sin base de datos: `VITE_DATA_MODE=mock` y `VITE_DEMO_MODE=true`.
