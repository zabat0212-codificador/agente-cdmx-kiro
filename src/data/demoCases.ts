import type { AgentRequest } from '../types/contract';

export interface DemoCase {
  etiqueta: string;
  request: AgentRequest;
}

export const DEMO_CASES: DemoCase[] = [
  {
    etiqueta: 'Abrir una cafetería',
    request: {
      id: 'demo-cafeteria',
      consultaCiudadana: 'quiero abrir una cafetería y que no me clausuren',
      alcaldia: 'Cuauhtémoc',
    },
  },
  {
    etiqueta: 'Licencia de conducir',
    request: {
      id: 'demo-licencia',
      consultaCiudadana: 'necesito sacar mi licencia de conducir',
      alcaldia: 'Coyoacán',
    },
  },
  {
    etiqueta: 'Acta de nacimiento',
    request: {
      id: 'demo-acta',
      consultaCiudadana: 'necesito una copia certificada de mi acta de nacimiento',
      alcaldia: 'Iztapalapa',
    },
  },
];
