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

export interface AgentRequest {
  id: string;
  consultaCiudadana: string;
  alcaldia: AlcaldiaCDMX;
  categoria?: CategoriaTramite;
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
}
