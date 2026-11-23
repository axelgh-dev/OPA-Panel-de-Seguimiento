import type { Comment } from '../types'
import { ADMIN_ID, AXEL_ID, EJ1_ID, EJ2_ID } from './profiles'
import { CONCILIA, PORTAL, SAT, WEB } from './projects'
import { hoursAgo, t } from './dates'

let n = 0
function c(
  project_id: string,
  target_type: Comment['target_type'],
  target_id: string,
  author_id: string,
  body: string,
  created_at: string,
  parent_id: string | null = null,
): Comment {
  n += 1
  return {
    id: `cm-${n}`,
    project_id,
    target_type,
    target_id,
    parent_id,
    author_id,
    body,
    created_at,
    edited_at: null,
    deleted_at: null,
  }
}

export const comments: Comment[] = [
  // Portal
  c(
    PORTAL,
    'project',
    PORTAL,
    ADMIN_ID,
    '@Axel ¿Cómo va el almacenamiento? Queremos arrancar el piloto con clientes cuanto antes.',
    hoursAgo(20),
  ),
  c(
    PORTAL,
    'project',
    PORTAL,
    AXEL_ID,
    'Sigo esperando la definición de cuánto tiempo se conservan los archivos. Con eso lo cierro en dos días.',
    hoursAgo(15),
    'cm-1',
  ),
  c(
    PORTAL,
    'update',
    'up-2',
    ADMIN_ID,
    'Lo platico con el socio mañana y te respondo.',
    hoursAgo(44),
  ),
  c(
    PORTAL,
    'deliverable',
    'dl-portal-3',
    EJ1_ID,
    'Probé subir 10 archivos juntos y funciona. ¿Se puede ver el tamaño de cada uno?',
    hoursAgo(5),
  ),
  c(
    PORTAL,
    'deliverable',
    'dl-portal-5',
    AXEL_ID,
    'Entendido, agrego "Declaraciones" y "Acuses" dentro de cada ejercicio y lo vuelvo a enviar.',
    t(-3, 10),
  ),
  c(
    PORTAL,
    'change_request',
    'cr-1',
    AXEL_ID,
    'Dejé la estimación en la solicitud. La opción de casilla de conformidad es la más rápida; la firma electrónica sí requiere un servicio de pago.',
    t(-2, 12),
  ),
  c(
    PORTAL,
    'change_request',
    'cr-1',
    ADMIN_ID,
    'Gracias. Lo vemos con el equipo y te confirmamos qué opción elegimos.',
    hoursAgo(30),
  ),
  // Conciliaciones
  c(
    CONCILIA,
    'update',
    'up-5',
    ADMIN_ID,
    'Muy bien. ¿Podemos ver la columna de "banco" en el reporte?',
    hoursAgo(3),
  ),
  c(
    CONCILIA,
    'deliverable',
    'dl-concilia-3',
    EJ2_ID,
    'Los resultados con el cliente de Banorte coinciden con lo que hicimos a mano. Excelente.',
    hoursAgo(26),
  ),
  c(
    CONCILIA,
    'project',
    CONCILIA,
    AXEL_ID,
    'Dejo en revisión el demo y el primer corte del reporte. Con su visto bueno sigo con la exportación.',
    t(0, 9, 30),
  ),
  c(
    CONCILIA,
    'change_request',
    'cr-3',
    AXEL_ID,
    'Acepto. Lo programo después del reporte de diferencias.',
    t(-8, 11),
  ),
  // SAT
  c(
    SAT,
    'update',
    'up-8',
    EJ1_ID,
    'El dominio para los correos será opasesores.ejemplo, remitente "avisos". Te mando los datos de DNS hoy.',
    hoursAgo(18),
  ),
  c(
    SAT,
    'project',
    SAT,
    ADMIN_ID,
    '@Axel entiendo el retraso, pero necesitamos las alertas antes del cierre del mes. ¿Hay forma de adelantar algo?',
    t(-1, 9),
  ),
  c(
    SAT,
    'deliverable',
    'dl-sat-2',
    AXEL_ID,
    'Ajusto el tono y la firma. Lo envío de nuevo esta semana.',
    t(-6, 12),
  ),
  c(
    SAT,
    'change_request',
    'cr-5',
    AXEL_ID,
    'Lo dejo rechazado por costo; lo podemos reconsiderar en una segunda etapa.',
    t(-12, 10),
  ),
  // Sitio web
  c(
    WEB,
    'deliverable',
    'dl-web-1',
    ADMIN_ID,
    'Falta una página para "Nómina". Aparte de eso, el mapa se ve bien.',
    hoursAgo(10),
  ),
  c(WEB, 'project', WEB, AXEL_ID, 'Perfecto, la agrego al mapa y lo vuelvo a enviar.', hoursAgo(6)),
  c(
    WEB,
    'change_request',
    'cr-8',
    AXEL_ID,
    'Lo estoy analizando. Preparo una propuesta con costo y esfuerzo.',
    t(-3, 16),
  ),
]
