import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { procesarConsulta } from '../agent/agentEngine';
import { ALCALDIAS } from '../data/cdmxData';
import { DEMO_CASES } from '../data/demoCases';
import type { AgentRequest, AgentResponse, AlcaldiaCDMX } from '../types/contract';

interface Mensaje {
  autor: 'ciudadano' | 'bot';
  texto: string;
}

const FOCO =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700';

function SelectorAlcaldia(props: {
  valor: AlcaldiaCDMX;
  onChange: (a: AlcaldiaCDMX) => void;
}) {
  return (
    <div>
      <label htmlFor="selector-alcaldia" className="block text-sm font-semibold text-gray-900">
        Tu alcaldía
      </label>
      <select
        id="selector-alcaldia"
        value={props.valor}
        onChange={(e) => props.onChange(e.target.value as AlcaldiaCDMX)}
        className={`mt-1 w-full rounded border border-gray-500 bg-white p-2 text-gray-900 ${FOCO}`}
      >
        {ALCALDIAS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
    </div>
  );
}

function BotonesDemo(props: { onElegir: (req: AgentRequest, etiqueta: string) => void; alcaldia: AlcaldiaCDMX }) {
  return (
    <section aria-labelledby="titulo-demo">
      <h2 id="titulo-demo" className="text-sm font-semibold text-gray-900">
        Prueba un ejemplo
      </h2>
      <div className="mt-2 flex flex-wrap gap-2">
        {DEMO_CASES.map((c) => (
          <button
            key={c.etiqueta}
            type="button"
            onClick={() => props.onElegir(c.request, c.etiqueta)}
            className={`rounded bg-blue-800 px-3 py-2 text-sm font-medium text-white hover:bg-blue-900 ${FOCO}`}
          >
            {c.etiqueta}
          </button>
        ))}
      </div>
    </section>
  );
}

function Chat(props: { mensajes: Mensaje[]; onEnviar: (texto: string) => void }) {
  const [texto, setTexto] = useState('');
  const vacio = texto.trim() === '';

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (vacio) return;
    props.onEnviar(texto.trim());
    setTexto('');
  };

  return (
    <section aria-labelledby="titulo-chat">
      <h2 id="titulo-chat" className="text-lg font-bold text-gray-900">
        Conversación
      </h2>
      <div
        aria-live="polite"
        role="log"
        className="mt-2 h-64 space-y-2 overflow-y-auto rounded border border-gray-400 bg-white p-3"
      >
        {props.mensajes.length === 0 && (
          <p className="text-sm text-gray-700">
            Escribe tu duda como hablas, por ejemplo: «quiero sacar mi licencia».
          </p>
        )}
        {props.mensajes.map((m, i) => (
          <p
            key={i}
            className={`max-w-[85%] rounded p-2 text-sm ${
              m.autor === 'ciudadano'
                ? 'ml-auto bg-blue-800 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}
          >
            <span className="sr-only">{m.autor === 'ciudadano' ? 'Tú: ' : 'TrámiBot: '}</span>
            {m.texto}
          </p>
        ))}
      </div>
      <form onSubmit={enviar} className="mt-2 flex gap-2">
        <label htmlFor="consulta-chat" className="sr-only">
          Escribe tu consulta
        </label>
        <input
          id="consulta-chat"
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="¿Qué trámite necesitas?"
          className={`flex-1 rounded border border-gray-500 p-2 text-gray-900 ${FOCO}`}
        />
        <button
          type="submit"
          disabled={vacio}
          className={`rounded bg-blue-800 px-4 py-2 text-sm font-medium text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-gray-600 ${FOCO}`}
        >
          Enviar
        </button>
      </form>
    </section>
  );
}

function ChecklistDocumentos(props: {
  documentos: string[];
  marcados: Set<string>;
  onAlternar: (doc: string) => void;
}) {
  return (
    <section aria-labelledby="titulo-docs">
      <h3 id="titulo-docs" className="text-base font-bold text-gray-900">
        Documentos que necesitas
      </h3>
      <ul className="mt-2 space-y-1">
        {props.documentos.map((doc, i) => {
          const id = `doc-${i}`;
          return (
            <li key={id} className="flex items-start gap-2">
              <input
                id={id}
                type="checkbox"
                checked={props.marcados.has(doc)}
                onChange={() => props.onAlternar(doc)}
                className={`mt-1 h-4 w-4 ${FOCO}`}
              />
              <label htmlFor={id} className="text-sm text-gray-900">
                {doc}
              </label>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function DistintivoLlave() {
  return (
    <span className="inline-block rounded-full bg-green-800 px-3 py-1 text-xs font-semibold text-white">
      Llave CDMX
    </span>
  );
}

function TarjetaCosto(props: { costo: string; alerta: string }) {
  return (
    <section
      aria-labelledby="titulo-costo"
      className="rounded border-2 border-amber-700 bg-amber-50 p-4"
    >
      <h3 id="titulo-costo" className="text-base font-bold text-gray-900">
        Costo oficial
      </h3>
      <p className="mt-1 text-2xl font-bold text-gray-900">{props.costo}</p>
      <p className="mt-2 text-sm text-gray-900">
        <span className="font-semibold">Ojo: </span>
        {props.alerta}
      </p>
    </section>
  );
}

function DetalleTramite(props: { r: AgentResponse }) {
  const { r } = props;
  return (
    <div className="space-y-4">
      <section aria-labelledby="titulo-pasos">
        <h3 id="titulo-pasos" className="text-base font-bold text-gray-900">
          Pasos a seguir
        </h3>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-900">
          {r.pasosAccion.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      </section>
      <dl className="space-y-2 text-sm text-gray-900">
        <div>
          <dt className="font-semibold">Tiempo de resolución</dt>
          <dd>{r.tiempoResolucion}</dd>
        </div>
        <div>
          <dt className="font-semibold">Fundamento legal</dt>
          <dd>{r.fundamentoNormativo}</dd>
        </div>
        <div>
          <dt className="font-semibold">Dónde acudir</dt>
          <dd>{r.ubicacionModuloAlcaldia}</dd>
        </div>
        <div>
          <dt className="font-semibold">A quién ayuda</dt>
          <dd>{r.impactoComunitario.poblacionObjetivo}</dd>
        </div>
        <div>
          <dt className="font-semibold">Ahorro estimado</dt>
          <dd>{r.impactoComunitario.ahorroEstimado}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DashboardCiudadano() {
  const [alcaldia, setAlcaldia] = useState<AlcaldiaCDMX>(ALCALDIAS[0]);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [respuesta, setRespuesta] = useState<AgentResponse | null>(null);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const contador = useRef(0);

  const nuevoId = () =>
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `req-${++contador.current}`;

  const ejecutar = (req: AgentRequest, textoUsuario: string) => {
    const res = procesarConsulta(req);
    setMensajes((prev) => [
      ...prev,
      { autor: 'ciudadano', texto: textoUsuario },
      { autor: 'bot', texto: res.resumenCiudadano },
    ]);
    setRespuesta(res);
    setMarcados(new Set());
  };

  const enviarChat = (texto: string) => {
    ejecutar({ id: nuevoId(), consultaCiudadana: texto, alcaldia }, texto);
  };

  const elegirDemo = (req: AgentRequest) => {
    setAlcaldia(req.alcaldia);
    ejecutar({ ...req, id: nuevoId() }, req.consultaCiudadana);
  };

  const alternar = (doc: string) => {
    setMarcados((prev) => {
      const sig = new Set(prev);
      if (sig.has(doc)) sig.delete(doc);
      else sig.add(doc);
      return sig;
    });
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 text-gray-900">
      <header>
        <h1 className="text-2xl font-bold">TrámiBot CDMX</h1>
        <p className="text-sm text-gray-700">
          Tu guía para hacer trámites en la Ciudad de México, sin vueltas ni coyotes.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <SelectorAlcaldia valor={alcaldia} onChange={setAlcaldia} />
          <BotonesDemo alcaldia={alcaldia} onElegir={elegirDemo} />
          <Chat mensajes={mensajes} onEnviar={enviarChat} />
        </div>

        <div className="space-y-4">
          {respuesta ? (
            <>
              <section aria-labelledby="titulo-tramite">
                <h2 id="titulo-tramite" className="text-lg font-bold">
                  {respuesta.nombreTramite}
                </h2>
                <p className="text-sm text-gray-700">
                  {respuesta.dependencia} · {respuesta.modalidad}
                </p>
                {respuesta.requiereLlaveCDMX && (
                  <div className="mt-2">
                    <DistintivoLlave />
                  </div>
                )}
              </section>
              <TarjetaCosto
                costo={respuesta.costoOficialMXN}
                alerta={respuesta.alertaAnticorrupcion}
              />
              <ChecklistDocumentos
                documentos={respuesta.documentosRequeridos}
                marcados={marcados}
                onAlternar={alternar}
              />
              <DetalleTramite r={respuesta} />
            </>
          ) : (
            <p className="rounded border border-dashed border-gray-500 p-4 text-sm text-gray-700">
              Aquí verás los pasos, documentos y costo de tu trámite.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardCiudadano;
