// Motor del agente (Rol 1). Local primero; LLM opcional (VITE_LLM_API_KEY) con fallback local.
import type {
  AgentRequest,
  AgentResponse,
  AlcaldiaCDMX,
  CategoriaTramite,
  Coordenadas,
  ModuloAtencion,
  ModuloCercano,
} from '../types/contract';
import {
  EXTRAS_TRAMITE,
  MODULOS,
  MODULOS_ALCALDIA,
  TRAMITES,
  type TramiteRecord,
} from '../data/cdmxData';

// ---------------------------------------------------------------------------
// Normalización (sin acentos, minúsculas, modismos comunes)
// ---------------------------------------------------------------------------
const MODISMOS: Record<string, string> = {
  pa: 'para',
  pq: 'porque',
  q: 'que',
  k: 'que',
  xq: 'porque',
  tramitar: 'sacar',
  chambita: 'negocio',
};

/** Minúsculas, sin acentos, sólo letras/dígitos separados por un espacio. Idempotente. */
export function normalizar(texto: string): string {
  const base = String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return base
    .split(' ')
    .map((t) => MODISMOS[t] ?? t)
    .join(' ');
}

function distanciaEdicion(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[b.length];
}

/** Herramienta local: busca el trámite con más palabras clave (exactas, luego tolerando errores de dedo). */
export function buscarTramite(
  consultaNorm: string,
  categoria?: CategoriaTramite,
): TramiteRecord | null {
  if (!consultaNorm) return null;
  const candidatos = categoria ? TRAMITES.filter((t) => t.categoria === categoria) : TRAMITES;

  let mejor: TramiteRecord | null = null;
  let mejorPuntos = 0;
  for (const tramite of candidatos) {
    let puntos = 0;
    for (const clave of tramite.palabrasClave) {
      if (clave && consultaNorm.includes(clave)) puntos += 1;
    }
    if (puntos > mejorPuntos) {
      mejor = tramite;
      mejorPuntos = puntos;
    }
  }
  if (mejor) return mejor;

  // Segunda pasada: tolerancia a errores de dedo palabra por palabra.
  const tokens = consultaNorm.split(' ').filter((t) => t.length >= 5);
  for (const tramite of candidatos) {
    let puntos = 0;
    for (const clave of tramite.palabrasClave) {
      if (clave.includes(' ') || clave.length < 5) continue;
      const tolerancia = clave.length >= 9 ? 2 : 1;
      if (tokens.some((t) => distanciaEdicion(t, clave) <= tolerancia)) puntos += 1;
    }
    if (puntos > mejorPuntos) {
      mejor = tramite;
      mejorPuntos = puntos;
    }
  }
  return mejor;
}

// ---------------------------------------------------------------------------
// Geolocalización: Haversine y módulo más cercano
// ---------------------------------------------------------------------------
const RADIO_TIERRA_KM = 6371;
const aRad = (g: number) => (g * Math.PI) / 180;

export function haversineKm(a: Coordenadas, b: Coordenadas): number {
  const dLat = aRad(b.lat - a.lat);
  const dLng = aRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRad(a.lat)) * Math.cos(aRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function urlGoogleMaps(m: Pick<ModuloAtencion, 'lat' | 'lng'>): string {
  return `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`;
}

/** Módulo de las 16 alcaldías más cercano a unas coordenadas. */
export function moduloMasCercano(coords: Coordenadas): ModuloCercano {
  let mejor = MODULOS[0];
  let mejorKm = Infinity;
  for (const m of MODULOS) {
    const km = haversineKm(coords, m);
    if (km < mejorKm) {
      mejor = m;
      mejorKm = km;
    }
  }
  return { modulo: mejor, distanciaKm: mejorKm, mapsUrl: urlGoogleMaps(mejor) };
}

function moduloDeAlcaldia(alcaldia: AlcaldiaCDMX, coords?: Coordenadas): ModuloCercano {
  const modulo = MODULOS.find((m) => m.alcaldia === alcaldia) ?? MODULOS[0];
  return {
    modulo,
    distanciaKm: coords ? haversineKm(coords, modulo) : undefined,
    mapsUrl: urlGoogleMaps(modulo),
  };
}

/** Herramienta local: módulo de atención de la alcaldía. Nunca lanza. */
export function obtenerUbicacion(alcaldia: AlcaldiaCDMX): string {
  return (
    MODULOS_ALCALDIA[alcaldia] ?? 'Acude a la ventanilla de atención ciudadana de tu alcaldía.'
  );
}

// ---------------------------------------------------------------------------
// Memoria colectiva (localStorage)
// ---------------------------------------------------------------------------
const CLAVE_MEMORIA = 'tramibot:memoria-colectiva';
const CLAVE_ULTIMO = 'tramibot:ultimo-tramite';

function almacen(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function leerMemoria(): Record<string, string[]> {
  try {
    const raw = almacen()?.getItem(CLAVE_MEMORIA);
    const data = raw ? (JSON.parse(raw) as unknown) : {};
    return data && typeof data === 'object' ? (data as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export function leerAprendido(tramiteId: string): string[] {
  const lista = leerMemoria()[tramiteId];
  return Array.isArray(lista) ? lista.filter((x) => typeof x === 'string') : [];
}

export function guardarAprendizaje(tramiteId: string, requisito: string): boolean {
  const memoria = leerMemoria();
  const actuales = Array.isArray(memoria[tramiteId]) ? memoria[tramiteId] : [];
  if (actuales.some((r) => normalizar(r) === normalizar(requisito))) return true;
  memoria[tramiteId] = [...actuales, requisito];
  try {
    almacen()?.setItem(CLAVE_MEMORIA, JSON.stringify(memoria));
    return true;
  } catch {
    return false;
  }
}

export function borrarMemoria(): void {
  try {
    almacen()?.removeItem(CLAVE_MEMORIA);
  } catch {
    /* sin almacenamiento disponible */
  }
}

function recordarUltimo(tramiteId: string): void {
  try {
    almacen()?.setItem(CLAVE_ULTIMO, tramiteId);
  } catch {
    /* ignorar */
  }
}

function leerUltimo(): string | null {
  try {
    return almacen()?.getItem(CLAVE_ULTIMO) ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Detección y extracción de entrenamiento ciudadano
// ---------------------------------------------------------------------------
const PATRON_ENTRENAMIENTO =
  /(?:te falto(?: decirme| mencionar| avisar| poner| decir)? que|me pidieron(?: tambien| ademas)?(?: que)?|agrega(?:r|le)? que|tambien me pidieron(?: que)?|ahora piden|agrega(?:r)? (?:el )?requisito)\s*(?:(?:tambien )?(?:piden|pidan|necesitan|se necesita|hay que|llevar)\s+)?(.+)$/;

/** Reemplaza cada unidad UTF-16 por su versión minúscula sin acento, conservando la longitud. */
function planoMismaLongitud(texto: string): string {
  return texto
    .split('')
    .map((c) => (c.normalize('NFD')[0] ?? c).toLowerCase()[0] ?? c)
    .join('');
}

export interface Entrenamiento {
  requisito: string;
  /** Texto previo al requisito, útil para identificar el trámite. */
  contexto: string;
}

export function detectarEntrenamiento(texto: string): Entrenamiento | null {
  const plano = planoMismaLongitud(texto);
  const m = PATRON_ENTRENAMIENTO.exec(plano);
  if (!m || !m[1]) return null;
  const inicio = m.index + m[0].length - m[1].length;
  const requisito = texto
    .slice(inicio)
    .trim()
    .replace(/[.!\s]+$/u, '')
    .slice(0, 200);
  if (requisito.length < 3) return null;
  return {
    requisito: requisito.charAt(0).toUpperCase() + requisito.slice(1),
    contexto: texto.slice(0, m.index),
  };
}

// ---------------------------------------------------------------------------
// Respuestas
// ---------------------------------------------------------------------------
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
      'No encontré ese trámite. Prueba con otras palabras, por ejemplo: "sacar mi licencia", "uso de suelo para mi local", "abrir una cafetería", "acta de nacimiento" o "reportar un bache".',
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

function armarRespuesta(req: AgentRequest, tramite: TramiteRecord): AgentResponse {
  const extras = EXTRAS_TRAMITE[tramite.id];
  const aprendido = leerAprendido(tramite.id);
  const moduloCercano = req.coordenadas
    ? moduloMasCercano(req.coordenadas)
    : moduloDeAlcaldia(req.alcaldia);
  recordarUltimo(tramite.id);

  return {
    id: req.id,
    tramiteId: tramite.id,
    nombreTramite: tramite.nombreTramite,
    dependencia: tramite.dependencia,
    requiereLlaveCDMX: tramite.requiereLlaveCDMX,
    modalidad: tramite.modalidad,
    resumenCiudadano: tramite.resumenCiudadano,
    pasosAccion: [...tramite.pasosAccion],
    documentosRequeridos: [...tramite.documentosRequeridos, ...aprendido],
    costoOficialMXN: formatearCosto(tramite.costoMXN),
    tiempoResolucion: tramite.tiempoResolucion,
    fundamentoNormativo: tramite.fundamentoNormativo,
    alertaAnticorrupcion: tramite.alertaAnticorrupcion,
    ubicacionModuloAlcaldia: `${moduloCercano.modulo.direccion}`,
    impactoComunitario: { ...tramite.impactoComunitario },
    variantes: extras?.variantes ? [...extras.variantes] : undefined,
    pasosOficiales: extras?.pasosOficiales,
    radiografiaCallejera: extras?.radiografia,
    aprendidoCiudadanos: aprendido,
    moduloCercano,
  };
}

export function procesarConsulta(req: AgentRequest): AgentResponse {
  try {
    const tramite = buscarTramite(normalizar(req.consultaCiudadana), req.categoria);
    if (!tramite) return respuestaNoEncontrada(req);
    return armarRespuesta(req, tramite);
  } catch {
    return respuestaNoEncontrada(req);
  }
}

// ---------------------------------------------------------------------------
// Punto de entrada del chat: consulta o entrenamiento
// ---------------------------------------------------------------------------
export type ResultadoMensaje =
  | { tipo: 'consulta'; respuesta: AgentResponse }
  | { tipo: 'entrenamiento'; texto: string; tramiteId: string; requisito: string }
  | { tipo: 'entrenamiento-sin-tramite'; texto: string };

export const TEXTO_ENTRENAMIENTO_OK =
  '✅ ¡Entrenamiento completado! Guardé tu reporte en mi memoria colectiva. A partir de este segundo, a cualquier ciudadano que pregunte por este trámite le advertiré sobre este requisito.';

let contador = 0;
const nuevoId = () => `msg-${Date.now().toString(36)}-${(contador++).toString(36)}`;

export function procesarMensaje(
  texto: string,
  alcaldia: AlcaldiaCDMX,
  coordenadas?: Coordenadas,
): ResultadoMensaje {
  const entrenamiento = detectarEntrenamiento(texto);
  if (entrenamiento) {
    const tramite =
      buscarTramite(normalizar(entrenamiento.contexto)) ??
      TRAMITES.find((t) => t.id === leerUltimo()) ??
      buscarTramite(normalizar(texto));
    if (!tramite) {
      return {
        tipo: 'entrenamiento-sin-tramite',
        texto:
          'Gracias por querer enseñarme. Primero dime de qué trámite hablas (por ejemplo "licencia") para guardar tu aporte en el trámite correcto.',
      };
    }
    guardarAprendizaje(tramite.id, entrenamiento.requisito);
    recordarUltimo(tramite.id);
    return {
      tipo: 'entrenamiento',
      texto: TEXTO_ENTRENAMIENTO_OK,
      tramiteId: tramite.id,
      requisito: entrenamiento.requisito,
    };
  }
  return {
    tipo: 'consulta',
    respuesta: procesarConsulta({ id: nuevoId(), consultaCiudadana: texto, alcaldia, coordenadas }),
  };
}

// ---------------------------------------------------------------------------
// LLM opcional (VITE_LLM_API_KEY). Solo clasifica el trámite si el motor local no lo encontró.
// Nota: una clave en el frontend queda expuesta; usar solo para la demo.
// ---------------------------------------------------------------------------
async function clasificarConLLM(texto: string): Promise<string | null> {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const clave = env.VITE_LLM_API_KEY;
  if (!clave) return null;
  const url = env.VITE_LLM_API_URL ?? 'https://api.openai.com/v1/chat/completions';
  const modelo = env.VITE_LLM_MODEL ?? 'gpt-4o-mini';
  const ids = TRAMITES.map((t) => t.id);
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 5000);
    const r = await fetch(url, {
      method: 'POST',
      signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clave}` },
      body: JSON.stringify({
        model: modelo,
        temperature: 0,
        messages: [
          {
            role: 'system',
            content: `Clasifica la consulta de un ciudadano de la CDMX. Responde SOLO con uno de estos ids o "ninguno": ${ids.join(', ')}.`,
          },
          { role: 'user', content: texto },
        ],
      }),
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const salida = data.choices?.[0]?.message?.content?.trim().toLowerCase() ?? '';
    return ids.find((id) => salida.includes(id)) ?? null;
  } catch {
    return null;
  }
}

/** Igual que procesarMensaje, pero usa el LLM (si hay clave) cuando el motor local no entiende. */
export async function procesarMensajeAsync(
  texto: string,
  alcaldia: AlcaldiaCDMX,
  coordenadas?: Coordenadas,
): Promise<ResultadoMensaje> {
  const local = procesarMensaje(texto, alcaldia, coordenadas);
  if (local.tipo !== 'consulta' || local.respuesta.tramiteId) return local;
  const id = await clasificarConLLM(texto);
  const tramite = TRAMITES.find((t) => t.id === id);
  if (!tramite) return local;
  return {
    tipo: 'consulta',
    respuesta: armarRespuesta(
      { id: local.respuesta.id, consultaCiudadana: texto, alcaldia, coordenadas },
      tramite,
    ),
  };
}
