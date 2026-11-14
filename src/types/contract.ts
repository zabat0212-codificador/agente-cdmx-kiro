// Fuente única de verdad para los tipos compartidos entre roles.
export interface AgentContract {
  id: string;
}

export interface DataContract {
  id: string;
}

export interface UiContract {
  id: string;
}

export type AlcaldiaCDMX =
  | 'Álvaro Obregón'
  | 'Azcapotzalco'
  | 'Benito Juárez'
  | 'Coyoacán'
  | 'Cuajimalpa de Morelos'
  | 'Cuauhtémoc'
  | 'Gustavo A. Madero'
  | 'Iztacalco'
  | 'Iztapalapa'
  | 'La Magdalena Contreras'
  | 'Miguel Hidalgo'
  | 'Milpa Alta'
  | 'Tláhuac'
  | 'Tlalpan'
  | 'Venustiano Carranza'
  | 'Xochimilco';

export type CategoriaTramite =
  | 'Negocios y Comercio (SIAPEM)'
  | 'Movilidad y Vehículos (SEMOVI)'
  | 'Vivienda y Uso de Suelo (SEDUVI)'
  | 'Identidad y Registro Civil'
  | 'Atención Ciudadana (SUAC)';

export interface Coordenadas {
  lat: number;
  lng: number;
}

/** Ventanilla Única de Trámites (VUT) / sede de alcaldía con coordenadas GPS. */
export interface ModuloAtencion {
  alcaldia: AlcaldiaCDMX;
  nombre: string;
  direccion: string;
  horario: string;
  lat: number;
  lng: number;
}

export interface ModuloCercano {
  modulo: ModuloAtencion;
  /** Presente solo cuando se conocen las coordenadas de la persona usuaria. */
  distanciaKm?: number;
  mapsUrl: string;
}

export interface EnlaceOficial {
  etiqueta: string;
  url: string;
}

export interface PasoOficial {
  numero: number;
  titulo: string;
  descripcion: string;
  enlaces: EnlaceOficial[];
  /** Si es true, la interfaz muestra aquí el módulo físico más cercano. */
  muestraModulo?: boolean;
}

export interface RadiografiaCallejera {
  fuente: string;
  advertencias: string[];
  nota: string;
}

export interface AgentRequest {
  id: string;
  consultaCiudadana: string;
  alcaldia: AlcaldiaCDMX;
  categoria?: CategoriaTramite;
  coordenadas?: Coordenadas;
}

export interface AgentResponse {
  id: string;
  nombreTramite: string;
  dependencia: string;
  requiereLlaveCDMX: boolean;
  modalidad: '100% Digital' | 'Híbrido' | 'Presencial';
  resumenCiudadano: string;
  pasosAccion: string[];
  documentosRequeridos: string[];
  costoOficialMXN: string; // p. ej. "$1,234.00 MXN" o "Gratuito"
  tiempoResolucion: string;
  fundamentoNormativo: string;
  alertaAnticorrupcion: string;
  ubicacionModuloAlcaldia: string;
  impactoComunitario: { poblacionObjetivo: string; ahorroEstimado: string };
  // Extensiones opcionales (versión end-to-end)
  tramiteId?: string;
  variantes?: string[];
  pasosOficiales?: PasoOficial[];
  radiografiaCallejera?: RadiografiaCallejera;
  /** Requisitos enseñados por otros ciudadanos (memoria colectiva, localStorage). */
  aprendidoCiudadanos?: string[];
  moduloCercano?: ModuloCercano;
  /** Aclaración sobre el módulo (p. ej. INE o verificentros tienen sus propios módulos). */
  notaModulo?: string;
}

/** Sub-trámite del explorador, listo para consultar en 1 clic. */
export interface SubTramite {
  tramiteId: string;
  etiqueta: string;
  detalle: string;
  /** Pregunta que se envía al chat al hacer clic. */
  consulta: string;
}

export interface CategoriaExplorador {
  id: string;
  icono: string;
  titulo: string;
  descripcion: string;
  destacada?: boolean;
  insignia?: string;
  subtramites: SubTramite[];
}
