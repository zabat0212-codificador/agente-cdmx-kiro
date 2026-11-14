import type { AlcaldiaCDMX } from '../types/contract';

export interface DemoCase {
  id: string;
  /** Texto del botón y mensaje que se envía al chat. */
  etiqueta: string;
  mensaje: string;
  /** Alcaldía de respaldo si no hay GPS ni selección previa. */
  alcaldia?: AlcaldiaCDMX;
  /** Si es true, intenta detectar la ubicación (con fallback a UP Mixcoac) antes de consultar. */
  usaGPS?: boolean;
}

export const DEMO_CASES: DemoCase[] = [
  {
    id: 'demo-licencia',
    etiqueta: '🚗 Quiero sacar mi licencia, ¿a qué links entro y qué módulo me queda cerca?',
    mensaje: 'Quiero sacar mi licencia, ¿a qué links entro y qué módulo me queda cerca?',
    alcaldia: 'Benito Juárez',
    usaGPS: true,
  },
  {
    id: 'demo-uso-suelo',
    etiqueta: '🏪 ¿Dónde saco el permiso de uso de suelo comercial para mi local sin coyotes?',
    mensaje: '¿Dónde saco el permiso de uso de suelo comercial para mi local sin coyotes?',
    alcaldia: 'Benito Juárez',
    usaGPS: true,
  },
  {
    id: 'demo-entrenar',
    etiqueta:
      '🧠 Fui hoy por mi licencia y te faltó decirme que piden CURP impresa al 200% y comprobante del mes actual',
    mensaje:
      'Fui hoy por mi licencia y te faltó decirme que piden CURP impresa al 200% y comprobante del mes actual',
  },
  {
    id: 'demo-verificar',
    etiqueta: '🔄 Volver a consultar requisitos de Licencia Tipo A (Ver lo que aprendió el bot)',
    mensaje: 'Volver a consultar requisitos de Licencia Tipo A (Ver lo que aprendió el bot)',
    usaGPS: true,
  },
];
