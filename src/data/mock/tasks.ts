import type { Task, TaskStatus } from '../types'
import { CONCILIA, PORTAL, SAT, WEB } from './projects'
import { d, t } from './dates'

let n = 0
function task(
  project_id: string,
  milestone_id: string | null,
  title: string,
  status: TaskStatus,
  due: number | null,
  is_internal = false,
): Task {
  n += 1
  return {
    id: `tk-${n}`,
    project_id,
    milestone_id,
    title,
    status,
    due_date: due === null ? null : d(due),
    is_internal,
    position: n,
    updated_at: t(status === 'hecha' ? -(10 + n) : -(n % 4)),
  }
}

export const tasks: Task[] = [
  // Portal de clientes
  task(PORTAL, 'ms-portal-1', 'Entrevistas con el equipo de atención a clientes', 'hecha', -70),
  task(PORTAL, 'ms-portal-1', 'Prototipo navegable en Figma', 'hecha', -60),
  task(PORTAL, 'ms-portal-2', 'Inicio de sesión con correo y contraseña', 'hecha', -45),
  task(PORTAL, 'ms-portal-2', 'Recuperación de contraseña por correo', 'hecha', -35),
  task(
    PORTAL,
    'ms-portal-2',
    'Definir política de contraseñas con el despacho',
    'hecha',
    -50,
    true,
  ),
  task(
    PORTAL,
    'ms-portal-3',
    'Pantalla de carga de documentos (arrastrar y soltar)',
    'en_progreso',
    2,
  ),
  task(PORTAL, 'ms-portal-3', 'Carpetas por cliente y ejercicio fiscal', 'en_progreso', 4),
  task(PORTAL, 'ms-portal-3', 'Validación de tipo y tamaño de archivo', 'pendiente', 5),
  task(PORTAL, 'ms-portal-3', 'Almacenamiento seguro con URL firmadas', 'bloqueada', 3),
  task(
    PORTAL,
    'ms-portal-3',
    'Revisar costo de almacenamiento en el plan gratuito',
    'pendiente',
    3,
    true,
  ),
  task(PORTAL, 'ms-portal-4', 'Aviso por correo cuando hay documentos nuevos', 'pendiente', 12),
  task(PORTAL, 'ms-portal-5', 'Selección de 5 clientes piloto', 'pendiente', 18),
  // Conciliaciones
  task(CONCILIA, 'ms-concilia-1', 'Recopilar muestras de estados de cuenta', 'hecha', -50),
  task(
    CONCILIA,
    'ms-concilia-1',
    'Documentar layouts de BBVA, Banorte, Santander y HSBC',
    'hecha',
    -46,
  ),
  task(CONCILIA, 'ms-concilia-2', 'Reglas de cruce por monto y fecha', 'hecha', -25),
  task(CONCILIA, 'ms-concilia-2', 'Cruce por referencia y concepto', 'hecha', -14),
  task(CONCILIA, 'ms-concilia-2', 'Optimizar lectura de archivos grandes', 'hecha', -10, true),
  task(CONCILIA, 'ms-concilia-3', 'Reporte de diferencias por cuenta', 'en_progreso', 3),
  task(
    CONCILIA,
    'ms-concilia-3',
    'Marcar manualmente movimientos como conciliados',
    'pendiente',
    6,
  ),
  task(CONCILIA, 'ms-concilia-3', 'Exportación del reporte a PDF', 'pendiente', 8),
  task(CONCILIA, 'ms-concilia-4', 'Guía rápida de uso para el equipo', 'pendiente', 20),
  // Obligaciones SAT
  task(SAT, 'ms-sat-1', 'Catálogo de obligaciones por régimen', 'hecha', -105),
  task(SAT, 'ms-sat-2', 'Importar padrón de clientes desde hoja de cálculo', 'hecha', -75),
  task(SAT, 'ms-sat-2', 'Asignación de obligaciones por régimen', 'hecha', -62),
  task(SAT, 'ms-sat-3', 'Plantilla de correo de alerta', 'hecha', -40),
  task(SAT, 'ms-sat-3', 'Programación de envíos a 7, 3 y 1 día', 'en_progreso', -2),
  task(
    SAT,
    'ms-sat-3',
    'Configurar remitente del correo con el dominio del despacho',
    'bloqueada',
    -4,
  ),
  task(
    SAT,
    'ms-sat-3',
    'Cambio de proveedor de correo por límites de envío',
    'en_progreso',
    -1,
    true,
  ),
  task(SAT, 'ms-sat-4', 'Vista de cumplimiento por cliente', 'pendiente', 14),
  task(SAT, 'ms-sat-4', 'Filtros por régimen y responsable', 'pendiente', 18),
  task(SAT, 'ms-sat-5', 'Formulario de carga de acuses', 'pendiente', 28),
  // Sitio web
  task(WEB, 'ms-web-1', 'Mapa del sitio', 'hecha', -3),
  task(WEB, 'ms-web-1', 'Textos por servicio (contabilidad, fiscal, nómina)', 'en_progreso', 8),
  task(WEB, 'ms-web-1', 'Sesión de fotos del equipo', 'pendiente', 10),
  task(WEB, 'ms-web-1', 'Revisar posicionamiento del sitio actual', 'en_progreso', 6, true),
  task(WEB, 'ms-web-2', 'Propuesta de dirección visual', 'pendiente', 16),
]
