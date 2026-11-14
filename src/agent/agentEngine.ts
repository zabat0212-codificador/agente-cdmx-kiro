// Motor del agente (Rol 1). Local, síncrono y sin servicios externos.
import type {
  AgentRequest,
  AgentResponse,
  AlcaldiaCDMX,
  CategoriaTramite,
} from '../types/contract';
import { MODULOS_ALCALDIA, TRAMITES, type TramiteRecord } from '../data/cdmxData';

/** Minúsculas, sin acentos, sólo letras/dígitos separados por un espacio. Idempotente. */
export function normalizar(texto: string): string {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Herramienta local: busca el trámite con más palabras clave en la consulta ya normalizada. */
export function buscarTramite(
  consultaNorm: string,
  categoria?: CategoriaTramite,
): TramiteRecord | null {
  if (!consultaNorm) return null;
  const candidatos = categoria
    ? TRAMITES.filter((t) => t.categoria === categoria)
    : TRAMITES;

  let mejor: TramiteRecord | null = null;
  let mejorPuntos = 0;
  for (const tramite of candidatos) {
    let puntos = 0;
    for (const clave of tramite.palabrasClave) {
      if (clave && consultaNorm.includes(clave)) puntos += 1;
    }
    // Estrictamente mayor: el empate lo gana el primero en el orden de TRAMITES.
    if (puntos > mejorPuntos) {
      mejor = tramite;
      mejorPuntos = puntos;
    }
  }
  return mejor;
}

/** Herramienta local: módulo de atención de la alcaldía. Nunca lanza. */
export function obtenerUbicacion(alcaldia: AlcaldiaCDMX): string {
  return (
    MODULOS_ALCALDIA[alcaldia] ??
    'Acude a la ventanilla de atención ciudadana de tu alcaldía.'
  );
}

/** 0 -> "Gratuito"; otro valor -> "$1,234.00 MXN". */
export function formatearCosto(costoMXN: number): string {
  if (costoMXN === 0) return 'Gratuito';
  const texto = costoMXN.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `$${texto} MXN`;
}

function respuestaNoEncontrada(req: AgentRequest): AgentResponse {
  return {
    id: req.id,
    nombreTramite: 'Trámite no encontrado',
    dependencia: 'No disponible',
    requiereLlaveCDMX: false,
    modalidad: 'Presencial',
    resumenCiudadano:
      'No se encontró el trámite que buscas. Intenta reformular tu consulta con otras palabras, por ejemplo: "abrir una cafetería", "sacar mi licencia" o "acta de nacimiento".',
    pasosAccion: [],
    documentosRequeridos: [],
    costoOficialMXN: 'No disponible',
    tiempoResolucion: 'No disponible',
    fundamentoNormativo: 'No disponible',
    alertaAnticorrupcion:
      'Los trámites oficiales no requieren pagos a intermediarios. Si te piden dinero extra, denuncia en Locatel.',
    ubicacionModuloAlcaldia: obtenerUbicacion(req.alcaldia),
    impactoComunitario: { poblacionObjetivo: 'No disponible', ahorroEstimado: 'No disponible' },
  };
}

export function procesarConsulta(req: AgentRequest): AgentResponse {
  try {
    const consultaNorm = normalizar(req.consultaCiudadana);
    const tramite = buscarTramite(consultaNorm, req.categoria);
    if (!tramite) return respuestaNoEncontrada(req);

    return {
      id: req.id,
      nombreTramite: tramite.nombreTramite,
      dependencia: tramite.dependencia,
      requiereLlaveCDMX: tramite.requiereLlaveCDMX,
      modalidad: tramite.modalidad,
      resumenCiudadano: tramite.resumenCiudadano,
      pasosAccion: [...tramite.pasosAccion],
      documentosRequeridos: [...tramite.documentosRequeridos],
      costoOficialMXN: formatearCosto(tramite.costoMXN),
      tiempoResolucion: tramite.tiempoResolucion,
      fundamentoNormativo: tramite.fundamentoNormativo,
      alertaAnticorrupcion: tramite.alertaAnticorrupcion,
      ubicacionModuloAlcaldia: obtenerUbicacion(req.alcaldia),
      impactoComunitario: { ...tramite.impactoComunitario },
    };
  } catch {
    return respuestaNoEncontrada(req);
  }
}
