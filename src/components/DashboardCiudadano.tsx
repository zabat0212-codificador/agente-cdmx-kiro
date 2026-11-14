import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import type { AgentResponse, AlcaldiaCDMX, Coordenadas } from '../types/contract';
import { ALCALDIAS, UP_MIXCOAC } from '../data/cdmxData';
import { DEMO_CASES, type DemoCase } from '../data/demoCases';
import {
  borrarMemoria,
  guardarGeminiKey,
  leerGeminiKey,
  moduloMasCercano,
  procesarMensajeAsync,
  urlGoogleMaps,
  type ProveedorIA,
} from '../agent/agentEngine';

const GUINDA = '#9F2241';
const DORADO = '#BC955C';

interface Mensaje {
  id: string;
  rol: 'usuario' | 'bot';
  texto?: string;
  respuesta?: AgentResponse;
  /** Modelo que generó el texto; undefined = texto local (la IA no respondió). */
  proveedorIA?: ProveedorIA;
  esIA?: boolean;
}

const ETIQUETA_IA: Record<ProveedorIA, string> = {
  gemini: '✨ Respuesta generada con IA (Gemini)',
  pollinations: '✨ Respuesta generada con IA',
};

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
let seq = 0;
const nuevoId = () => `m-${Date.now().toString(36)}-${seq++}`;

const SALUDO: Mensaje = {
  id: 'saludo',
  rol: 'bot',
  texto:
    '¡Hola! Soy TrámiBot CDMX. Dime qué trámite necesitas, con tus palabras (licencia, uso de suelo, abrir un negocio, actas, reportes). Te doy la ruta oficial, tus documentos, el costo real y el módulo más cercano. Si ya fuiste a ventanilla y te pidieron algo extra, cuéntamelo y lo aprendo.',
};

/* ------------------------------ Tarjetas ------------------------------ */

function EnlaceBoton({ url, etiqueta }: { url: string; etiqueta: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center rounded-md border px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{ backgroundColor: GUINDA, borderColor: GUINDA }}
    >
      {etiqueta} <span aria-hidden="true">↗</span>
    </a>
  );
}

function TarjetaModulo({ r }: { r: AgentResponse }) {
  const mc = r.moduloCercano;
  if (!mc) return null;
  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
      <p className="font-semibold">
        📍 {mc.modulo.nombre}
        {mc.distanciaKm !== undefined && (
          <span className="ml-1 font-normal text-gray-600">
            · a {mc.distanciaKm.toFixed(1)} km de ti
          </span>
        )}
      </p>
      <p className="mt-1">{mc.modulo.direccion}</p>
      <p className="text-gray-600">🕘 {mc.modulo.horario}</p>
      <div className="mt-2">
        <a
          href={mc.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: DORADO, color: GUINDA }}
        >
          🗺️ Abrir ubicación en Google Maps
        </a>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Sede de referencia en tu Alcaldía (confirma el módulo específico asignado al generar tu cita
        oficial)
      </p>
    </div>
  );
}

function RutaPasoAPaso({ r }: { r: AgentResponse }) {
  const pasos = r.pasosOficiales;
  if (!pasos || pasos.length === 0) return null;
  return (
    <section aria-label="Ruta paso a paso" className="mt-3">
      <h4 className="text-sm font-bold" style={{ color: GUINDA }}>
        🧭 Ruta paso a paso
      </h4>
      <ol className="mt-2 space-y-3">
        {pasos.map((p) => (
          <li key={p.numero} className="flex gap-3">
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: DORADO }}
              aria-hidden="true"
            >
              {p.numero}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Paso {p.numero}: {p.titulo}
              </p>
              <p className="text-sm text-gray-700">{p.descripcion}</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {p.enlaces.map((e) => (
                  <EnlaceBoton key={e.url + e.etiqueta} url={e.url} etiqueta={e.etiqueta} />
                ))}
              </div>
              {p.muestraModulo && <TarjetaModulo r={r} />}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ChecklistDocumentos({ r }: { r: AgentResponse }) {
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const docs = r.documentosRequeridos;
  if (docs.length === 0) return null;
  const aprendidos = new Set(r.aprendidoCiudadanos ?? []);
  const alternar = (i: number) =>
    setMarcados((prev) => {
      const sig = new Set(prev);
      if (sig.has(i)) sig.delete(i);
      else sig.add(i);
      return sig;
    });
  const pct = Math.round((marcados.size / docs.length) * 100);
  return (
    <section aria-label="Checklist de documentos" className="mt-4">
      <h4 className="text-sm font-bold" style={{ color: GUINDA }}>
        ✅ Checklist de documentos
      </h4>
      <p className="mt-1 text-sm font-medium text-gray-800" aria-live="polite">
        Tienes {marcados.size} de {docs.length} requisitos listos para tu cita
      </p>
      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={docs.length}
        aria-valuenow={marcados.size}
        aria-label="Progreso de requisitos"
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: DORADO }}
        />
      </div>
      <ul className="mt-2 space-y-1.5">
        {docs.map((d, i) => {
          const esAprendido = aprendidos.has(d);
          return (
            <li key={`${i}-${d}`}>
              <label
                className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1 text-sm ${
                  esAprendido ? 'bg-yellow-100 ring-1 ring-yellow-400' : 'hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={marcados.has(i)}
                  onChange={() => alternar(i)}
                  style={{ accentColor: GUINDA }}
                />
                <span className={marcados.has(i) ? 'text-gray-500 line-through' : 'text-gray-900'}>
                  {esAprendido && <strong>🧠 Nuevo de ciudadanos: </strong>}
                  {d}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RadiografiaCallejera({ r }: { r: AgentResponse }) {
  const rc = r.radiografiaCallejera;
  if (!rc) return null;
  return (
    <section
      aria-label="Radiografía callejera"
      className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3"
    >
      <h4 className="text-sm font-bold text-amber-900">
        ⚠️ Lo que advierten otros ciudadanos que ya fueron a ventanilla
      </h4>
      <p className="text-xs text-amber-800">{rc.fuente}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-950">
        {rc.advertencias.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
    </section>
  );
}

function MemoriaColectiva({
  r,
  onEntrenar,
  onBorrar,
}: {
  r: AgentResponse;
  onEntrenar: () => void;
  onBorrar: () => void;
}) {
  const aprendido = r.aprendidoCiudadanos ?? [];
  return (
    <section
      aria-label="Memoria colectiva"
      className="mt-4 rounded-lg border p-3"
      style={{ borderColor: DORADO, backgroundColor: '#FBF6EC' }}
    >
      <h4 className="text-sm font-bold" style={{ color: GUINDA }}>
        🧠 Aprendido de ciudadanos en fila
      </h4>
      {aprendido.length === 0 ? (
        <p className="mt-1 text-sm text-gray-700">
          Todavía nadie me ha enseñado requisitos extra para este trámite.
        </p>
      ) : (
        <ul className="mt-2 space-y-1">
          {aprendido.map((a) => (
            <li
              key={a}
              className="rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-gray-900 ring-1 ring-yellow-400"
            >
              🧠 {a}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onEntrenar}
          className="rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-white focus-visible:outline-none focus-visible:ring-2"
          style={{ borderColor: GUINDA, color: GUINDA }}
        >
          ➕ ¿Fuiste a ventanilla y te pidieron algo extra? Entrena al bot aquí
        </button>
        {aprendido.length > 0 && (
          <button
            type="button"
            onClick={onBorrar}
            className="text-xs text-gray-500 underline hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2"
          >
            Borrar memoria (reiniciar prueba)
          </button>
        )}
      </div>
    </section>
  );
}

function TarjetaTramite({
  r,
  onEntrenar,
  onBorrar,
}: {
  r: AgentResponse;
  onEntrenar: () => void;
  onBorrar: () => void;
}) {
  const encontrado = r.nombreTramite !== 'Trámite no encontrado';
  return (
    <div className="mt-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-bold text-gray-900">{r.nombreTramite}</h3>
        {encontrado && (
          <>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {r.modalidad}
            </span>
            {r.requiereLlaveCDMX && (
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: GUINDA }}
              >
                🔑 Requiere Llave CDMX
              </span>
            )}
          </>
        )}
      </div>
      {encontrado && <p className="text-xs text-gray-600">{r.dependencia}</p>}

      {encontrado && (
        <>
          {r.variantes && r.variantes.length > 0 && (
            <p className="mt-2 text-sm text-gray-800">
              <strong>Variantes:</strong> {r.variantes.join(' · ')}
            </p>
          )}

          <div
            className="mt-3 rounded-lg border-2 p-3"
            style={{ borderColor: DORADO, backgroundColor: '#FBF6EC' }}
          >
            <p className="text-xs font-bold uppercase tracking-wide text-gray-700">
              Costo oficial · anti-coyotes
            </p>
            <p className="text-2xl font-extrabold" style={{ color: GUINDA }}>
              {r.costoOficialMXN}
            </p>
            <p className="text-sm text-gray-800">🛡️ {r.alertaAnticorrupcion}</p>
            <p className="mt-1 text-xs text-gray-600">
              Cuotas del Código Fiscal; confirma el monto vigente en tu línea de captura.
            </p>
          </div>

          <RutaPasoAPaso r={r} />
          {!r.pasosOficiales?.some((p) => p.muestraModulo) && <TarjetaModulo r={r} />}
          <ChecklistDocumentos r={r} />
          <RadiografiaCallejera r={r} />
          <MemoriaColectiva r={r} onEntrenar={onEntrenar} onBorrar={onBorrar} />

          <details className="mt-4 text-sm text-gray-800">
            <summary className="cursor-pointer font-semibold">Más detalles</summary>
            <p className="mt-2">⏱️ {r.tiempoResolucion}</p>
            <p className="mt-1">⚖️ {r.fundamentoNormativo}</p>
            <p className="mt-1">👥 {r.impactoComunitario.poblacionObjetivo}</p>
            <p className="mt-1">💰 {r.impactoComunitario.ahorroEstimado}</p>
          </details>
        </>
      )}
    </div>
  );
}

/* ------------------------------ Dashboard ------------------------------ */

export function DashboardCiudadano() {
  const [alcaldia, setAlcaldia] = useState<AlcaldiaCDMX>('Benito Juárez');
  const [coords, setCoords] = useState<Coordenadas | null>(null);
  const [estadoGPS, setEstadoGPS] = useState<string>('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([SALUDO]);
  const [entrada, setEntrada] = useState('');
  const [pendiente, setPendiente] = useState(false);
  const [tieneKey, setTieneKey] = useState<boolean>(() => Boolean(leerGeminiKey()));
  const [panelKey, setPanelKey] = useState(false);
  const [keyEntrada, setKeyEntrada] = useState('');
  const finRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [mensajes, pendiente]);

  const aplicarCoords = useCallback((c: Coordenadas, origen: 'gps' | 'respaldo', aviso?: string) => {
    const cercano = moduloMasCercano(c);
    setCoords(c);
    setAlcaldia(cercano.modulo.alcaldia);
    setEstadoGPS(
      origen === 'gps'
        ? `📍 Ubicación detectada: módulo más cercano en ${cercano.modulo.alcaldia} (${(cercano.distanciaKm ?? 0).toFixed(1)} km)`
        : `📍 ${aviso ?? 'Usando ubicación de respaldo (UP Mixcoac)'}: módulo más cercano en ${cercano.modulo.alcaldia} (${(cercano.distanciaKm ?? 0).toFixed(1)} km)`,
    );
    return { coords: c, alcaldia: cercano.modulo.alcaldia };
  }, []);

  const detectarUbicacion = useCallback(
    (): Promise<{ coords: Coordenadas; alcaldia: AlcaldiaCDMX }> =>
      new Promise((resolve) => {
        const respaldo = (aviso: string) => resolve(aplicarCoords(UP_MIXCOAC, 'respaldo', aviso));
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
          respaldo('Tu navegador no ofrece GPS; usé UP Mixcoac como referencia');
          return;
        }
        setEstadoGPS('📡 Buscando tu ubicación…');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            if ((moduloMasCercano(c).distanciaKm ?? Infinity) > 40) {
              respaldo('Tu ubicación está fuera de la CDMX; usé UP Mixcoac como referencia');
            } else {
              resolve(aplicarCoords(c, 'gps'));
            }
          },
          () => respaldo('No pude usar tu GPS (permiso bloqueado); usé UP Mixcoac como referencia'),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 },
        );
      }),
    [aplicarCoords],
  );

  const enviar = useCallback(
    async (texto: string, demo?: DemoCase) => {
      const t = texto.trim();
      if (!t || pendiente) return;
      setMensajes((m) => [...m, { id: nuevoId(), rol: 'usuario', texto: t }]);
      setEntrada('');
      setPendiente(true);
      try {
        let alc = alcaldia;
        let c = coords;
        if (demo?.usaGPS && !c) {
          const r = await detectarUbicacion();
          alc = r.alcaldia;
          c = r.coords;
        }
        const historial = mensajes
          .filter((m) => m.texto && m.id !== 'saludo')
          .map((m) => ({ rol: m.rol, texto: m.texto as string }));
        const [res] = await Promise.all([
          procesarMensajeAsync(t, alc, c ?? undefined, historial),
          esperar(1000),
        ]);
        const nuevo: Mensaje =
          res.tipo === 'consulta'
            ? {
                id: nuevoId(),
                rol: 'bot',
                texto: res.respuesta.resumenCiudadano,
                respuesta: res.respuesta,
                proveedorIA: res.proveedorIA,
                esIA: Boolean(res.proveedorIA),
              }
            : res.tipo === 'conversacion'
              ? {
                  id: nuevoId(),
                  rol: 'bot',
                  texto: res.texto,
                  proveedorIA: res.proveedorIA,
                  esIA: true,
                }
              : { id: nuevoId(), rol: 'bot', texto: res.texto };
        setMensajes((m) => [...m, nuevo]);
      } catch {
        setMensajes((m) => [
          ...m,
          {
            id: nuevoId(),
            rol: 'bot',
            texto: 'Tuve un problema al procesar tu mensaje. Intenta de nuevo.',
          },
        ]);
      } finally {
        setPendiente(false);
      }
    },
    [alcaldia, coords, detectarUbicacion, mensajes, pendiente],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void enviar(entrada);
  };

  const prepararEntrenamiento = () => {
    setEntrada('En el módulo me pidieron también ');
    inputRef.current?.focus();
  };

  const olvidar = () => {
    borrarMemoria();
    setMensajes((m) => [
      ...m,
      {
        id: nuevoId(),
        rol: 'bot',
        texto: '🗑️ Memoria colectiva borrada. Vuelve a consultar el trámite para ver los requisitos oficiales.',
      },
    ]);
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 text-gray-900">
      <header className="px-4 py-3 text-white shadow" style={{ backgroundColor: GUINDA }}>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-extrabold leading-tight">TrámiBot CDMX</h1>
            <p className="text-xs" style={{ color: '#F3E2C2' }}>
              Tu agente ciudadano de trámites · sin coyotes, sin filas innecesarias
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPanelKey((v) => !v)}
            aria-expanded={panelKey}
            className="rounded-full border border-white/50 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2"
          >
            {tieneKey ? '⚡ IA Gemini activa (Configurar Key)' : '⚡ IA Conectada (Configurar Key)'}
          </button>
        </div>
        {panelKey && (
          <form
            className="mx-auto mt-3 flex max-w-3xl flex-wrap items-center gap-2 rounded-lg bg-white/10 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              guardarGeminiKey(keyEntrada);
              setTieneKey(Boolean(keyEntrada.trim()));
              setKeyEntrada('');
              setPanelKey(false);
            }}
          >
            <label htmlFor="gemini-key" className="text-xs">
              Gemini API Key (opcional; sin ella el bot usa un modelo gratuito)
            </label>
            <input
              id="gemini-key"
              type="password"
              value={keyEntrada}
              onChange={(e) => setKeyEntrada(e.target.value)}
              placeholder="Pega tu API Key"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-md px-2 py-1 text-sm text-gray-900"
            />
            <button
              type="submit"
              className="rounded-md px-3 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: DORADO }}
            >
              Guardar
            </button>
            {tieneKey && (
              <button
                type="button"
                onClick={() => {
                  guardarGeminiKey('');
                  setTieneKey(Boolean(leerGeminiKey()));
                  setPanelKey(false);
                }}
                className="text-xs underline"
              >
                Quitar key
              </button>
            )}
          </form>
        )}
      </header>

      <div className="border-b bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
            Demo en 1 clic
          </p>
          <div className="mt-2 grid max-h-44 grid-cols-1 gap-2 overflow-y-auto sm:max-h-none sm:grid-cols-2">
            {DEMO_CASES.map((d) => (
              <button
                key={d.id}
                type="button"
                disabled={pendiente}
                onClick={() => void enviar(d.mensaje, d)}
                className="rounded-lg border px-3 py-2 text-left text-sm font-medium leading-snug hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50"
                style={{ borderColor: DORADO }}
              >
                {d.etiqueta}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label htmlFor="alcaldia" className="block text-xs font-semibold text-gray-700">
                Tu alcaldía
              </label>
              <select
                id="alcaldia"
                value={alcaldia}
                onChange={(e) => {
                  setAlcaldia(e.target.value as AlcaldiaCDMX);
                  setCoords(null);
                  setEstadoGPS('');
                }}
                className="mt-1 rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus-visible:outline-none focus-visible:ring-2"
              >
                {ALCALDIAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => void detectarUbicacion()}
              className="rounded-md px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2"
              style={{ backgroundColor: GUINDA }}
            >
              📍 Detectar mi ubicación en CDMX
            </button>
            {coords && (
              <a
                href={urlGoogleMaps(coords)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-600 underline"
              >
                ver mi punto
              </a>
            )}
          </div>
          {estadoGPS && (
            <p className="mt-2 text-xs text-gray-700" role="status">
              {estadoGPS}
            </p>
          )}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite">
        <div className="mx-auto max-w-3xl space-y-4">
          {mensajes.map((m) =>
            m.rol === 'usuario' ? (
              <div key={m.id} className="flex justify-end">
                <p
                  className="max-w-[85%] rounded-2xl rounded-br-sm px-4 py-2 text-sm text-white"
                  style={{ backgroundColor: GUINDA }}
                >
                  {m.texto}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex items-start gap-2">
                <span
                  className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                  style={{ backgroundColor: DORADO }}
                  aria-hidden="true"
                >
                  🤖
                </span>
                <div className="min-w-0 max-w-[92%] flex-1">
                  <p className="inline-block whitespace-pre-line rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm">
                    {m.texto}
                  </p>
                  {m.proveedorIA && (
                    <p className="mt-1 text-xs text-gray-500">{ETIQUETA_IA[m.proveedorIA]}</p>
                  )}
                  {m.respuesta && !m.proveedorIA && (
                    <p className="mt-1 text-xs text-gray-500">
                      Respuesta de la base local (la IA no estuvo disponible)
                    </p>
                  )}
                  {m.respuesta && (
                    <TarjetaTramite
                      r={m.respuesta}
                      onEntrenar={prepararEntrenamiento}
                      onBorrar={olvidar}
                    />
                  )}
                </div>
              </div>
            ),
          )}
          {pendiente && (
            <div className="flex items-start gap-2" role="status">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                style={{ backgroundColor: DORADO }}
                aria-hidden="true"
              >
                🤖
              </span>
              <p className="animate-pulse rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
                Verificando fuentes oficiales .cdmx.gob.mx y reportes ciudadanos en Reddit/X...
              </p>
            </div>
          )}
          <div ref={finRef} />
        </div>
      </main>

      <form onSubmit={onSubmit} className="border-t bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl gap-2">
          <label htmlFor="mensaje" className="sr-only">
            Escribe tu mensaje
          </label>
          <input
            id="mensaje"
            ref={inputRef}
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder="Escribe tu trámite, por ejemplo: quiero abrir una cafetería y que no me clausuren"
            className="min-w-0 flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={pendiente || !entrada.trim()}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2"
            style={{ backgroundColor: GUINDA }}
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}

export default DashboardCiudadano;
