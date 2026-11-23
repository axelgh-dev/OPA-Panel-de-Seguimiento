import type { ProjectUpdate } from '../types'
import { AXEL_ID } from './profiles'
import { CONCILIA, PORTAL, SAT, WEB } from './projects'
import { t } from './dates'

function u(
  id: string,
  project_id: string,
  type: ProjectUpdate['type'],
  title: string,
  body_md: string,
  days: number,
  hour = 18,
): ProjectUpdate {
  return {
    id,
    project_id,
    author_id: AXEL_ID,
    type,
    title,
    body_md,
    published_at: t(days, hour),
    created_at: t(days, hour),
  }
}

export const updates: ProjectUpdate[] = [
  u(
    'up-1',
    PORTAL,
    'entrega',
    'Pantalla de carga de documentos lista para revisión',
    `Ya puedes probar la **pantalla de carga** en el ambiente de pruebas.

- Arrastrar y soltar varios archivos a la vez.
- Barra de progreso por archivo.
- Lista de lo entregado, con fecha y hora.

Pendiente: validar tipos de archivo. Les pido que la revisen y me digan si la lista de entregados les sirve así.`,
    -1,
    17,
  ),
  u(
    'up-2',
    PORTAL,
    'bloqueo',
    'Almacenamiento seguro detenido por una decisión del despacho',
    `Para guardar los documentos necesito saber **cuánto tiempo deben conservarse** los archivos de los clientes y si pueden vivir en un servicio en la nube.

Mientras no se defina, el avance de este hito se desacelera. Esto es lo que pone en riesgo la fecha del hito 3 (+6 días).

> Necesito una respuesta de Admin OPA antes del viernes para no mover la fecha.`,
    -3,
    11,
  ),
  u(
    'up-3',
    PORTAL,
    'avance',
    'Carpetas por cliente y ejercicio',
    `Avancé en la estructura de carpetas. Cada cliente tiene su espacio y dentro, un nivel por **ejercicio fiscal**.

Pedí la validación de la estructura en el entregable correspondiente.`,
    -7,
    16,
  ),
  u(
    'up-4',
    PORTAL,
    'reunion',
    'Reunión de seguimiento con Admin OPA',
    `**Acuerdos**
1. Se aprueba el acceso de clientes.
2. Se pide agregar carpetas de "Declaraciones" y "Acuses".
3. Se evaluará la firma electrónica como cambio de alcance.

Próxima revisión: viernes de la próxima semana.`,
    -12,
    13,
  ),
  u(
    'up-5',
    CONCILIA,
    'entrega',
    'Primer corte del reporte de diferencias',
    `Subí el primer corte del **reporte de diferencias** por cuenta. Incluye movimientos sin conciliar y los que concilian con diferencia de centavos.

Quedo atento a sus comentarios sobre las columnas que quieren ver.`,
    0,
    9,
  ),
  u(
    'up-6',
    CONCILIA,
    'avance',
    'Conciliación con 3 clientes reales',
    `Probé el motor con **3 clientes** (datos anonimizados). Resultado: *94 %* de movimientos conciliados automáticamente. El resto queda para revisión humana en el reporte.`,
    -2,
    12,
  ),
  u(
    'up-7',
    CONCILIA,
    'nota',
    'Banregio queda fuera del alcance inicial',
    `Se mantiene el alcance a cuatro bancos. Banregio se agrega como solicitud de cambio con estimación aparte.`,
    -9,
    15,
  ),
  u(
    'up-8',
    SAT,
    'bloqueo',
    'Alertas por correo retrasadas',
    `El proveedor de correo que usaba tiene límites de envío muy bajos para las alertas. Estoy migrando a otro, y además necesito que el despacho me confirme el **dominio y remitente** con el que saldrán los avisos.

Impacto estimado en el hito: **+8 días** sobre lo planeado.`,
    -2,
    10,
  ),
  u(
    'up-9',
    SAT,
    'avance',
    'Programación de envíos 7, 3 y 1 día',
    `La lógica de envíos ya calcula las fechas de aviso por cliente. Falta conectar el nuevo proveedor de correo.`,
    -8,
    17,
  ),
  u(
    'up-10',
    SAT,
    'reunion',
    'Revisión del calendario con el equipo fiscal',
    `Se revisaron las obligaciones por régimen. Se pide una opción para marcar obligaciones como **"no aplica"** por cliente. Se registrará como solicitud de cambio.`,
    -20,
    12,
  ),
  u(
    'up-11',
    WEB,
    'avance',
    'Mapa del sitio listo',
    `Terminé el **mapa del sitio**: Inicio, Servicios (contabilidad, fiscal, nómina, asesoría), Nosotros, Contacto. Se envía a revisión.`,
    -3,
    14,
  ),
  u(
    'up-12',
    WEB,
    'nota',
    'Conservar la paleta actual',
    `Mantendré el dorado y el azul marino del sitio actual, con un fondo más claro y tipografía más moderna.`,
    -6,
    11,
  ),
  u(
    'up-13',
    WEB,
    'reunion',
    'Arranque del proyecto',
    `Reunión de arranque. Se definió que el sitio será **informativo**, sin portal de clientes, y que el contenido lo proporciona el despacho.`,
    -10,
    12,
  ),
  u(
    'up-14',
    PORTAL,
    'nota',
    'Ambiente de pruebas disponible',
    `Ya existe un ambiente de pruebas para revisar los avances sin afectar nada real. Les comparto el enlace en cada entregable.`,
    -25,
    10,
  ),
]
