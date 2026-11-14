// Motor del agente (Rol 1). Búsqueda local + IA conversacional con RAG (Gemini o Pollinations) y fallback local.
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

/** Punto exacto (lat,lng), p. ej. la ubicación de la persona usuaria. */
export function urlGoogleMaps(m: Pick<ModuloAtencion, 'lat' | 'lng'>): string {
  return `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`;
}

/** URL universal de Google Maps para un módulo, buscada por nombre y dirección. */
export function urlGoogleMapsModulo(m: ModuloAtencion): string {
  const q = encodeURIComponent(`${m.nombre} ${m.direccion} ${m.alcaldia} CDMX`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
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
  return { modulo: mejor, distanciaKm: mejorKm, mapsUrl: urlGoogleMapsModulo(mejor) };
}

function moduloDeAlcaldia(alcaldia: AlcaldiaCDMX, coords?: Coordenadas): ModuloCercano {
  const modulo = MODULOS.find((m) => m.alcaldia === alcaldia) ?? MODULOS[0];
  return {
    modulo,
    distanciaKm: coords ? haversineKm(coords, modulo) : undefined,
    mapsUrl: urlGoogleMapsModulo(modulo),
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
// Punto de entrada del chat: consulta, conversación o entrenamiento
// ---------------------------------------------------------------------------
export type ProveedorIA = 'gemini' | 'pollinations';

export type ResultadoMensaje =
  | { tipo: 'consulta'; respuesta: AgentResponse; proveedorIA?: ProveedorIA }
  | { tipo: 'conversacion'; texto: string; proveedorIA?: ProveedorIA }
  | { tipo: 'entrenamiento'; texto: string; tramiteId: string; requisito: string }
  | { tipo: 'entrenamiento-sin-tramite'; texto: string };

export interface TurnoChat {
  rol: 'usuario' | 'bot';
  texto: string;
}

export const TEXTO_ENTRENAMIENTO_OK =
  '✅ ¡Entrenamiento completado! Guardé tu reporte en mi memoria colectiva. A partir de este segundo, a cualquier ciudadano que pregunte por este trámite le advertiré sobre este requisito.';

let contador = 0;
const nuevoId = () => `msg-${Date.now().toString(36)}-${(contador++).toString(36)}`;

/** Parte local: entrenamiento ciudadano o identificación del trámite (para las tarjetas). */
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
// IA conversacional con RAG: cada consulta se responde con un modelo real
// usando como contexto los datos oficiales, la alcaldía y la memoria colectiva.
// Orden: Gemini (si hay API key) -> Pollinations (sin llave) -> texto local.
// ---------------------------------------------------------------------------
const CLAVE_GEMINI = 'GEMINI_API_KEY';
const URL_POLLINATIONS = 'https://text.pollinations.ai/openai';
const TIMEOUT_IA_MS = 20000;

export function leerGeminiKey(): string {
  try {
    const guardada = almacen()?.getItem(CLAVE_GEMINI);
    if (guardada) return guardada;
  } catch {
    /* ignorar */
  }
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  return env.VITE_GEMINI_API_KEY ?? '';
}

export function guardarGeminiKey(clave: string): void {
  try {
    const limpia = clave.trim();
    if (limpia) almacen()?.setItem(CLAVE_GEMINI, limpia);
    else almacen()?.removeItem(CLAVE_GEMINI);
  } catch {
    /* ignorar */
  }
}

function resumenTramite(t: TramiteRecord, aprendido: string[]) {
  const extras = EXTRAS_TRAMITE[t.id];
  return {
    id: t.id,
    nombre: t.nombreTramite,
    dependencia: t.dependencia,
    modalidad: t.modalidad,
    requiereLlaveCDMX: t.requiereLlaveCDMX,
    costoOficial: formatearCosto(t.costoMXN),
    resumen: t.resumenCiudadano,
    pasos: t.pasosAccion,
    documentosOficiales: t.documentosRequeridos,
    requisitosAprendidosDeCiudadanos_noOficiales: aprendido,
    tiempo: t.tiempoResolucion,
    fundamentoNormativo: t.fundamentoNormativo,
    variantes: extras?.variantes ?? [],
    enlacesOficiales: (extras?.pasosOficiales ?? []).flatMap((p) => p.enlaces),
  };
}

export function construirSystemPrompt(
  foco: TramiteRecord | null,
  alcaldia: AlcaldiaCDMX,
  coordenadas?: Coordenadas,
): string {
  const memoria = leerMemoria();
  const modulo = coordenadas ? moduloMasCercano(coordenadas) : moduloDeAlcaldia(alcaldia);
  const catalogo = TRAMITES.map(
    (t) => `- ${t.id}: ${t.nombreTramite} (${formatearCosto(t.costoMXN)})`,
  ).join('\n');
  const hoy = new Date().toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return [
    'Eres TrámiBot CDMX, asistente de trámites de la Ciudad de México. Hablas español de México, claro y cálido, sin jerga técnica.',
    `Fecha de hoy: ${hoy}. Alcaldía de la persona: ${alcaldia}.`,
    'REGLAS:',
    '1. Responde DIRECTAMENTE la pregunta específica de la persona (si pregunta por un horario, un documento, un caso especial o "cómo le hago", contesta eso, no repitas una ficha genérica).',
    '2. Usa SOLO los DATOS OFICIALES de abajo para costos, requisitos, fechas y enlaces. No inventes montos, horarios ni requisitos. Si el dato no está, dilo y recomienda confirmarlo en el portal oficial o en tu cita.',
    '3. Si el tema es la licencia permanente, usa solo el trámite "licencia-permanente"; si es la de 3 años, usa "licencia-tipo-a". No las mezcles.',
    '4. Los requisitos de "requisitosAprendidosDeCiudadanos_noOficiales" los reportaron otros ciudadanos: menciónalos como advertencia ("otros ciudadanos reportaron...") y no como regla oficial.',
    '5. Responde en 2 a 4 oraciones (máximo 90 palabras), texto plano sin markdown, listas ni tablas: los pasos, documentos y enlaces ya se muestran en tarjetas debajo de tu respuesta, no los repitas completos. No pidas la Llave CDMX ni datos personales sensibles. Nunca aconsejes pagar a gestores o "coyotes".',
    `MÓDULO DE REFERENCIA: ${modulo.modulo.nombre}, ${modulo.modulo.direccion}. Horario: ${modulo.modulo.horario}.${
      modulo.distanciaKm !== undefined ? ` Está a ${modulo.distanciaKm.toFixed(1)} km de la persona.` : ''
    }`,
    `CATÁLOGO DE TRÁMITES:\n${catalogo}`,
    foco
      ? `DATOS OFICIALES DEL TRÁMITE EN FOCO (JSON):\n${JSON.stringify(
          resumenTramite(foco, memoria[foco.id] ?? []),
        )}`
      : 'No hay un trámite en foco: si la pregunta no encaja en el catálogo, dilo y sugiere cuáles puedes ayudar a resolver.',
  ].join('\n');
}

/** Quita espacios invisibles raros y márgenes de la salida del modelo. */
function limpiarTexto(t?: string): string {
  return (t ?? '').replace(/[\u00a0\u202f\u2009\u200b]/g, ' ').trim();
}

async function fetchConTimeout(url: string, init: RequestInit): Promise<Response> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_IA_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function llamarGemini(
  clave: string,
  system: string,
  historial: TurnoChat[],
  consulta: string,
): Promise<string | null> {
  try {
    const contents = [
      ...historial.map((h) => ({
        role: h.rol === 'usuario' ? 'user' : 'model',
        parts: [{ text: h.texto }],
      })),
      { role: 'user', parts: [{ text: consulta }] },
    ];
    const r = await fetchConTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${clave}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1024,
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      },
    );
    if (!r.ok) return null;
    const data = (await r.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const texto = limpiarTexto(data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join(''));
    return texto || null;
  } catch {
    return null;
  }
}

async function llamarPollinations(
  system: string,
  historial: TurnoChat[],
  consulta: string,
  reintento = true,
): Promise<string | null> {
  try {
    const r = await fetchConTimeout(URL_POLLINATIONS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: [
          { role: 'system', content: system },
          ...historial.map((h) => ({
            role: h.rol === 'usuario' ? 'user' : 'assistant',
            content: h.texto,
          })),
          { role: 'user', content: consulta },
        ],
      }),
    });
    if (!r.ok) {
      // El servicio gratuito limita a 1 respuesta cada ~45 s por IP: se espera y se reintenta una vez.
      if (reintento && (r.status === 402 || r.status === 429)) {
        const detalle = await r.text();
        const espera = Number(/retry after (\d+)s/i.exec(detalle)?.[1] ?? 0);
        if (espera > 0 && espera <= 20) {
          await new Promise((res) => setTimeout(res, (espera + 1) * 1000));
          return llamarPollinations(system, historial, consulta, false);
        }
      }
      return null;
    }
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const texto = limpiarTexto(data.choices?.[0]?.message?.content);
    return texto || null;
  } catch {
    return null;
  }
}

export async function generarRespuestaIA(
  consulta: string,
  foco: TramiteRecord | null,
  alcaldia: AlcaldiaCDMX,
  coordenadas: Coordenadas | undefined,
  historial: TurnoChat[],
): Promise<{ texto: string; proveedor: ProveedorIA } | null> {
  const system = construirSystemPrompt(foco, alcaldia, coordenadas);
  // Gemini exige que la conversación empiece con un turno de la persona.
  const recientes = historial.slice(-6);
  while (recientes.length > 0 && recientes[0].rol === 'bot') recientes.shift();

  const clave = leerGeminiKey();
  if (clave) {
    const texto = await llamarGemini(clave, system, recientes, consulta);
    if (texto) return { texto, proveedor: 'gemini' };
  }
  const texto = await llamarPollinations(system, recientes, consulta);
  return texto ? { texto, proveedor: 'pollinations' } : null;
}

/**
 * Flujo completo del chat: entrenamiento local, o consulta con IA + RAG.
 * Si la IA no responde, se usa el texto local del trámite.
 */
export async function procesarMensajeAsync(
  texto: string,
  alcaldia: AlcaldiaCDMX,
  coordenadas?: Coordenadas,
  historial: TurnoChat[] = [],
): Promise<ResultadoMensaje> {
  const local = procesarMensaje(texto, alcaldia, coordenadas);
  if (local.tipo !== 'consulta') return local;

  const resp = local.respuesta;
  const encontrado = Boolean(resp.tramiteId);
  // Sin coincidencia directa (p. ej. "¿puedo ir el sábado?") se usa el último trámite consultado.
  const foco = TRAMITES.find((t) => t.id === (resp.tramiteId ?? leerUltimo())) ?? null;

  const ia = await generarRespuestaIA(texto, foco, alcaldia, coordenadas, historial);
  if (!ia) {
    if (encontrado) return local;
    return {
      tipo: 'conversacion',
      texto:
        'En este momento no pude consultar a la IA para responder tu pregunta específica. Intenta de nuevo en unos segundos, o pega una Gemini API Key en el botón ⚡ de arriba para respuestas sin límite.',
    };
  }

  if (encontrado) {
    return {
      tipo: 'consulta',
      respuesta: { ...resp, resumenCiudadano: ia.texto },
      proveedorIA: ia.proveedor,
    };
  }
  return { tipo: 'conversacion', texto: ia.texto, proveedorIA: ia.proveedor };
}
