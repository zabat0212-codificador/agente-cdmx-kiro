// Base de datos local de trámites de la CDMX (Rol 2).
// Costos: cuotas del Código Fiscal de la Ciudad de México vigentes en 2026.
// Las cuotas cambian cada ejercicio fiscal; confirmar en finanzas.cdmx.gob.mx antes de pagar.
import type {
  AgentResponse,
  AlcaldiaCDMX,
  CategoriaTramite,
  ModuloAtencion,
  PasoOficial,
  RadiografiaCallejera,
} from '../types/contract';

export interface TramiteRecord {
  id: string;
  nombreTramite: string;
  categoria: CategoriaTramite;
  dependencia: string;
  requiereLlaveCDMX: boolean;
  modalidad: AgentResponse['modalidad'];
  resumenCiudadano: string;
  pasosAccion: string[];
  documentosRequeridos: string[];
  costoMXN: number; // 0 = gratuito; el engine lo formatea a texto
  tiempoResolucion: string;
  fundamentoNormativo: string;
  alertaAnticorrupcion: string;
  impactoComunitario: AgentResponse['impactoComunitario'];
  palabrasClave: string[]; // ya normalizadas: minúsculas, sin acentos
}

export const ALCALDIAS: AlcaldiaCDMX[] = [
  'Álvaro Obregón',
  'Azcapotzalco',
  'Benito Juárez',
  'Coyoacán',
  'Cuajimalpa de Morelos',
  'Cuauhtémoc',
  'Gustavo A. Madero',
  'Iztacalco',
  'Iztapalapa',
  'La Magdalena Contreras',
  'Miguel Hidalgo',
  'Milpa Alta',
  'Tláhuac',
  'Tlalpan',
  'Venustiano Carranza',
  'Xochimilco',
];

export const CATEGORIAS: CategoriaTramite[] = [
  'Negocios y Comercio (SIAPEM)',
  'Movilidad y Vehículos (SEMOVI)',
  'Vivienda y Uso de Suelo (SEDUVI)',
  'Identidad y Registro Civil',
  'Atención Ciudadana (SUAC)',
];

// Sede de cada alcaldía, donde está su Centro de Servicios y Atención Ciudadana (CESAC / ventanilla única).
const DIRECCIONES_ALCALDIA: Record<AlcaldiaCDMX, string> = {
  'Álvaro Obregón':
    'Alcaldía Álvaro Obregón, Calle 10 s/n esq. Av. Canario, Col. Tolteca, C.P. 01150, Ciudad de México',
  Azcapotzalco:
    'Alcaldía Azcapotzalco, Av. Castilla Oriente 38, Col. Azcapotzalco Centro, C.P. 02000, Ciudad de México',
  'Benito Juárez':
    'Alcaldía Benito Juárez, Av. División del Norte 1611, Col. Santa Cruz Atoyac, C.P. 03310, Ciudad de México',
  Coyoacán:
    'Alcaldía Coyoacán, Av. Hidalgo 289, Col. Del Carmen, C.P. 04100, Ciudad de México',
  'Cuajimalpa de Morelos':
    'Alcaldía Cuajimalpa de Morelos, Av. Juárez 71, Col. Contadero, C.P. 05500, Ciudad de México',
  Cuauhtémoc:
    'Alcaldía Cuauhtémoc, Aldama y Mina s/n, Col. Buenavista, C.P. 06350, Ciudad de México',
  'Gustavo A. Madero':
    'Alcaldía Gustavo A. Madero, Av. 5 de Febrero s/n esq. Vicente Villada, Col. Villa Gustavo A. Madero, C.P. 07050, Ciudad de México',
  Iztacalco:
    'Alcaldía Iztacalco, Av. Río Churubusco y Av. Te s/n, Col. Gabriel Ramos Millán, C.P. 08000, Ciudad de México',
  Iztapalapa:
    'Alcaldía Iztapalapa, Aldama s/n esq. Ayuntamiento, Barrio San Lucas, C.P. 09000, Ciudad de México',
  'La Magdalena Contreras':
    'Alcaldía La Magdalena Contreras, Av. Álvaro Obregón 20, Col. Barranca Seca, C.P. 10580, Ciudad de México',
  'Miguel Hidalgo':
    'Alcaldía Miguel Hidalgo, Parque Lira 94, Col. Observatorio, C.P. 11860, Ciudad de México',
  'Milpa Alta':
    'Alcaldía Milpa Alta, Av. Constitución esq. Andalucía s/n, Col. Villa Milpa Alta Centro, C.P. 12000, Ciudad de México',
  Tláhuac:
    'Alcaldía Tláhuac, Av. Tláhuac esq. Margarita Maza de Juárez s/n, Barrio La Asunción, C.P. 13000, Ciudad de México',
  Tlalpan:
    'Alcaldía Tlalpan, Plaza de la Constitución 1, Col. Tlalpan Centro, C.P. 14000, Ciudad de México',
  'Venustiano Carranza':
    'Alcaldía Venustiano Carranza, Francisco del Paso y Troncoso 219, Col. Jardín Balbuena, C.P. 15900, Ciudad de México',
  Xochimilco:
    'Alcaldía Xochimilco, Pino s/n esq. Guerrero, Barrio El Rosario, C.P. 16070, Ciudad de México',
};

export const TRAMITES: TramiteRecord[] = [
  {
    id: 'apertura-negocio-bajo-impacto',
    nombreTramite: 'Aviso de apertura de establecimiento mercantil de bajo impacto',
    categoria: 'Negocios y Comercio (SIAPEM)',
    dependencia: 'Secretaría de Desarrollo Económico (SEDECO) / Alcaldía, vía SIAPEM',
    requiereLlaveCDMX: true,
    modalidad: '100% Digital',
    resumenCiudadano:
      'Para abrir un negocio de bajo impacto (cafetería, abarrotes, papelería, estética, taquería sin venta de alcohol) presentas un aviso en línea en el SIAPEM. No pagas el aviso y puedes operar desde que lo ingresas, siempre que el uso de suelo del local permita el giro.',
    pasosAccion: [
      'Consulta gratis en SIG CiudadMX si el uso de suelo de tu predio permite el giro (o tramita el Certificado Único de Zonificación).',
      'Crea o abre tu cuenta Llave CDMX.',
      'Entra al SIAPEM (siapem.cdmx.gob.mx) y elige "Aviso para el funcionamiento de establecimientos mercantiles con giro de bajo impacto".',
      'Captura los datos del titular, del local y del giro, y adjunta los documentos.',
      'Ingresa el aviso y descarga tu acuse. Tenlo impreso o en tu celular en el local.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente del titular',
      'CURP o RFC',
      'Comprobante de domicilio del titular',
      'Cuenta catastral y dirección del local',
      'Documento que acredite el uso de suelo (consulta en SIG CiudadMX o certificado)',
      'Documento que acredite la propiedad o posesión del local (contrato de arrendamiento o escritura)',
    ],
    costoMXN: 0,
    tiempoResolucion: 'Inmediato: el negocio puede operar desde que se ingresa el aviso en el SIAPEM',
    fundamentoNormativo:
      'Ley de Establecimientos Mercantiles de la Ciudad de México (giros de bajo impacto, aviso de funcionamiento)',
    alertaAnticorrupcion:
      'El aviso de bajo impacto no tiene costo y se hace en línea. Nadie necesita cobrarte "por agilizar" ni "para evitar clausuras". Si te piden dinero, denuncia en Locatel o con la Contraloría General de la CDMX.',
    impactoComunitario: {
      poblacionObjetivo:
        'Personas emprendedoras y microempresas de la CDMX que abren comercios de bajo impacto',
      ahorroEstimado:
        'Hasta cientos de pesos por evitar gestores y multas por operar sin aviso; el aviso no cuesta',
    },
    palabrasClave: [
      'abrir un negocio',
      'abrir mi negocio',
      'abrir negocio',
      'abrir una cafeteria',
      'cafeteria',
      'cafe',
      'taqueria',
      'fonda',
      'abarrotes',
      'tiendita',
      'papeleria',
      'estetica',
      'clausuren',
      'clausura',
      'clausurar',
      'clausuran',
      'no me cierren',
      'poner un negocio',
      'poner mi negocio',
      'poner un local',
      'montar un negocio',
      'emprender',
      'chamba propia',
      'bajo impacto',
      'establecimiento mercantil',
      'giro mercantil',
      'siapem',
      'aviso de apertura',
      'licencia de funcionamiento',
      'permiso para negocio',
      'negosio',
      'nogocio',
      'cafetria',
      'tacheria',
    ],
  },
  {
    id: 'licencia-tipo-a',
    nombreTramite: 'Licencia de conducir Tipo A (automovilista particular, 3 años)',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría de Movilidad (SEMOVI)',
    requiereLlaveCDMX: true,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'La licencia Tipo A es para conducir automóvil particular en la CDMX. Se expide, renueva o repone con vigencia de tres años. Haces el registro y el pago en línea y acudes a un módulo de SEMOVI con tu cita para la toma de fotografía y firma.',
    pasosAccion: [
      'Entra a tramites.cdmx.gob.mx con tu cuenta Llave CDMX.',
      'Elige "Licencia de conducir tipo A" y captura tus datos.',
      'Genera tu línea de captura y paga en línea o en bancos y tiendas autorizadas.',
      'Agenda tu cita en el Sistema de Citas de SEMOVI y elige un módulo.',
      'Acude con tus documentos originales, toma de fotografía y firma, y recibe tu licencia.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente con fotografía',
      'Comprobante de domicilio reciente (máximo 3 meses)',
      'CURP',
      'Línea de captura pagada',
      'Licencia anterior (en renovación o reposición)',
      'Acta circunstanciada o denuncia (solo si es reposición por robo o extravío)',
    ],
    costoMXN: 1142,
    tiempoResolucion: 'La licencia se entrega en el mismo día de la cita en módulo',
    fundamentoNormativo:
      'Ley de Movilidad de la Ciudad de México, Reglamento de Tránsito de la Ciudad de México y Código Fiscal de la Ciudad de México (derechos por licencias)',
    alertaAnticorrupcion:
      'Paga solo con línea de captura oficial. Las citas en módulos de SEMOVI son gratuitas; no pagues a "coyotes" ni a gestores en la calle.',
    impactoComunitario: {
      poblacionObjetivo: 'Personas conductoras de automóvil particular en la CDMX',
      ahorroEstimado:
        'Evita pagos a gestores y multas por conducir sin licencia vigente',
    },
    palabrasClave: [
      'licencia de conducir',
      'licencia para manejar',
      'licencia de manejo',
      'licencia tipo a',
      'sacar mi licencia',
      'sacar la licencia',
      'renovar licencia',
      'renovar mi licencia',
      'reponer licencia',
      'reposicion de licencia',
      'licencia',
      'manejar',
      'conducir',
      'licensia',
      'licensia de conducir',
      'lisencia',
      'licenzia',
      'liscencia',
    ],
  },
  {
    id: 'tarjeta-circulacion',
    nombreTramite: 'Renovación o reposición de Tarjeta de Circulación',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría de Movilidad (SEMOVI)',
    requiereLlaveCDMX: true,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'La tarjeta de circulación acredita que tu vehículo está registrado en la CDMX. La renovación de vigencia se hace en línea. La reposición del plástico por pérdida, robo o deterioro requiere cita en un módulo de SEMOVI.',
    pasosAccion: [
      'Revisa que tu vehículo no tenga adeudos de tenencia o multas.',
      'Entra al portal de trámites de la CDMX con tu Llave CDMX.',
      'Para renovar la vigencia, captura placa y CURP o RFC, genera tu pago y descarga el comprobante.',
      'Para reponer el plástico, paga la línea de captura y agenda tu cita en el Sistema de Citas de SEMOVI.',
      'Lleva tu documentación original a la cita y conserva tu comprobante.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente con fotografía',
      'Tarjeta de circulación anterior (o acta circunstanciada ante Juzgado Cívico si se extravió)',
      'Denuncia ante la Fiscalía (solo si fue robo)',
      'Línea de captura pagada',
      'Carta poder firmada ante dos testigos (si el trámite lo hace otra persona)',
    ],
    costoMXN: 433,
    tiempoResolucion:
      'Renovación en línea: comprobante inmediato. Reposición: se entrega en el módulo el día de la cita',
    fundamentoNormativo:
      'Reglamento de Tránsito de la Ciudad de México y Código Fiscal de la Ciudad de México (derechos de control vehicular)',
    alertaAnticorrupcion:
      'El costo oficial es el que marca tu línea de captura. Desconfía de quien cobre de más por "acelerar" tu cita o tu tarjeta.',
    impactoComunitario: {
      poblacionObjetivo: 'Personas propietarias de vehículos registrados en la CDMX',
      ahorroEstimado:
        'Evita multas por tarjeta vencida y el pago a intermediarios',
    },
    palabrasClave: [
      'tarjeta de circulacion',
      'tarjeta de circulasion',
      'tarjeta circulacion',
      'targeta de circulacion',
      'tarjeta del carro',
      'tarjeta de mi carro',
      'tarjeta del coche',
      'tarjeta del auto',
      'tarjeta del vehiculo',
      'refrendo',
      'renovar tarjeta',
      'reposicion de tarjeta',
      'perdi la tarjeta',
      'me robaron la tarjeta',
      'papeles del carro',
      'papeles del coche',
      'engomado',
      'circulacion vehicular',
    ],
  },
  {
    id: 'cuzus',
    nombreTramite: 'Certificado Único de Zonificación de Uso del Suelo',
    categoria: 'Vivienda y Uso de Suelo (SEDUVI)',
    dependencia: 'Secretaría de Desarrollo Urbano y Vivienda (SEDUVI)',
    requiereLlaveCDMX: true,
    modalidad: '100% Digital',
    resumenCiudadano:
      'El Certificado Único de Zonificación de Uso del Suelo dice qué se puede hacer en un predio (vivienda, comercio, oficinas, etc.). Se solicita en línea con la cuenta catastral y se paga el derecho correspondiente. Sirve para trámites de construcción, compra o negocios.',
    pasosAccion: [
      'Consulta gratis la zonificación de tu predio en SIG CiudadMX con la cuenta catastral.',
      'Entra al sistema de Certificado Digital de SEDUVI con tu Llave CDMX.',
      'Captura la cuenta catastral y la dirección del predio.',
      'Genera tu línea de captura y realiza el pago.',
      'Descarga tu certificado digital y valida su autenticidad en el mismo sistema.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente del solicitante',
      'Cuenta catastral del predio',
      'Dirección completa del predio',
      'Línea de captura pagada',
      'Carta poder firmada ante dos testigos (si el trámite lo hace otra persona)',
    ],
    costoMXN: 2104,
    tiempoResolucion: 'La versión digital se emite al concluir el pago y la captura en línea',
    fundamentoNormativo:
      'Ley de Desarrollo Urbano del Distrito Federal, Programas de Desarrollo Urbano vigentes y Código Fiscal de la Ciudad de México, art. 235',
    alertaAnticorrupcion:
      'La consulta de zonificación en SIG CiudadMX es gratuita. Solo el certificado tiene costo y se paga con línea de captura oficial. No pagues a gestores que prometen "uso de suelo seguro".',
    impactoComunitario: {
      poblacionObjetivo:
        'Propietarias, propietarios y emprendedores que necesitan acreditar el uso de suelo de un predio',
      ahorroEstimado:
        'Evita pagar más de $3,000 MXN a gestores sobre el derecho oficial',
    },
    palabrasClave: [
      'uso de suelo',
      'uso del suelo',
      'uso de zuelo',
      'uzo de suelo',
      'zonificacion',
      'certificado de zonificacion',
      'certificado unico',
      'cuzus',
      'seduvi',
      'se puede construir',
      'puedo construir',
      'permiso de construccion',
      'cuenta catastral',
      'certificado de uso',
      'que se puede hacer en mi terreno',
      'terreno',
      'predio',
    ],
  },
  {
    id: 'acta-registro-civil',
    nombreTramite: 'Copia certificada de acta del Registro Civil',
    categoria: 'Identidad y Registro Civil',
    dependencia: 'Dirección General del Registro Civil de la Ciudad de México',
    requiereLlaveCDMX: true,
    modalidad: '100% Digital',
    resumenCiudadano:
      'Puedes obtener la copia certificada de tu acta de nacimiento, matrimonio o defunción en línea si el registro se hizo en la CDMX. Pagas el derecho, descargas el acta en PDF y la imprimes en papel normal. También puedes pedirla en un módulo del Registro Civil.',
    pasosAccion: [
      'Entra al portal del Registro Civil de la CDMX (registrocivil.cdmx.gob.mx).',
      'Inicia sesión con tu Llave CDMX.',
      'Elige el tipo de acta y busca el registro con CURP o con los datos de la persona.',
      'Paga la línea de captura en línea.',
      'Descarga el acta certificada (PDF); también queda en tu Llave CDMX Expediente.',
    ],
    documentosRequeridos: [
      'CURP o datos de la persona registrada (nombre, fecha y lugar de nacimiento)',
      'Identificación oficial de quien solicita',
      'Correo electrónico',
      'Cuenta Llave CDMX',
      'Tarjeta bancaria o línea de captura para el pago',
    ],
    costoMXN: 98,
    tiempoResolucion: 'Descarga inmediata en línea tras el pago; en módulo, normalmente el mismo día',
    fundamentoNormativo:
      'Código Civil para el Distrito Federal, Reglamento del Registro Civil del Distrito Federal y Código Fiscal de la Ciudad de México (derechos del Registro Civil)',
    alertaAnticorrupcion:
      'La copia certificada cuesta lo que marca el Código Fiscal. Evita páginas falsas que cobran de más y gestores afuera de los módulos.',
    impactoComunitario: {
      poblacionObjetivo:
        'Personas nacidas, casadas o con familiares fallecidos con registro en la CDMX',
      ahorroEstimado:
        'Evita traslados y filas, y pagos extra a sitios y gestores no oficiales',
    },
    palabrasClave: [
      'acta de nacimiento',
      'acta de matrimonio',
      'acta de defuncion',
      'acta certificada',
      'acta',
      'registro civil',
      'copia certificada',
      'copia del acta',
      'mi acta',
      'acta de nasimiento',
      'acta de nacimento',
      'akta',
      'partida de nacimiento',
      'curp',
      'nacimiento',
    ],
  },
  {
    id: 'reporte-suac-locatel',
    nombreTramite: 'Reporte ciudadano SUAC / Locatel',
    categoria: 'Atención Ciudadana (SUAC)',
    dependencia: 'Locatel y Sistema Unificado de Atención Ciudadana (SUAC) de la Ciudad de México',
    requiereLlaveCDMX: false,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'Si tienes un problema en tu colonia (bache, fuga de agua, luminaria descompuesta, basura, árbol caído), puedes reportarlo gratis a Locatel por teléfono, WhatsApp o en línea. Recibes un folio para dar seguimiento a tu solicitud.',
    pasosAccion: [
      'Llama a Locatel al 55 5658 1111 o ingresa a locatel.cdmx.gob.mx.',
      'Describe el problema y da la dirección exacta con calle, colonia y alcaldía.',
      'Anota el folio que te dan.',
      'Da seguimiento con tu folio por el mismo canal.',
      'Si no hay respuesta, acude a la ventanilla de la alcaldía con tu folio.',
    ],
    documentosRequeridos: [
      'Dirección exacta del problema (calle, colonia y alcaldía)',
      'Descripción breve de lo que ocurre',
      'Fotografía del problema (opcional)',
      'Datos de contacto (opcional)',
    ],
    costoMXN: 0,
    tiempoResolucion: 'El folio se genera al momento; la atención depende del tipo de servicio y del área responsable',
    fundamentoNormativo:
      'Ley de Procedimiento Administrativo de la Ciudad de México y derecho de petición, artículo 8 de la Constitución Política de los Estados Unidos Mexicanos',
    alertaAnticorrupcion:
      'Reportar a Locatel o SUAC es gratuito. Nadie debe cobrarte por atender un reporte, ni pedirte dinero por darle seguimiento.',
    impactoComunitario: {
      poblacionObjetivo: 'Habitantes y personas que transitan por la CDMX',
      ahorroEstimado:
        'Sin costo para la persona usuaria; mejora los servicios públicos de la colonia',
    },
    palabrasClave: [
      'locatel',
      'suac',
      'reporte ciudadano',
      'reportar',
      'queja',
      'denuncia ciudadana',
      'bache',
      'baches',
      'hoyo en la calle',
      'fuga de agua',
      'fuga',
      'luminaria',
      'lampara descompuesta',
      'alumbrado',
      'no hay luz en la calle',
      'basura',
      'arbol caido',
      'coladera',
      'drenaje tapado',
      'sin agua',
      'atencion ciudadana',
    ],
  },
];

// ---------------------------------------------------------------------------
// Módulos de atención por alcaldía con coordenadas GPS.
// Las coordenadas son aproximadas (sede de cada alcaldía) y sirven para calcular
// el módulo más cercano con Haversine. Confirma horario y dirección en la cita oficial.
// ---------------------------------------------------------------------------
const HORARIO_VUT = 'Lunes a viernes, aprox. 9:00 a 15:00 h (confirma antes de ir)';

const COORDS: Record<AlcaldiaCDMX, [number, number]> = {
  'Álvaro Obregón': [19.3589, -99.2037],
  Azcapotzalco: [19.4869, -99.1844],
  'Benito Juárez': [19.3708, -99.1608],
  Coyoacán: [19.3499, -99.162],
  'Cuajimalpa de Morelos': [19.3569, -99.2975],
  Cuauhtémoc: [19.4472, -99.1527],
  'Gustavo A. Madero': [19.4833, -99.113],
  Iztacalco: [19.3955, -99.0975],
  Iztapalapa: [19.3574, -99.0577],
  'La Magdalena Contreras': [19.3322, -99.2402],
  'Miguel Hidalgo': [19.4086, -99.1915],
  'Milpa Alta': [19.1923, -99.0233],
  Tláhuac: [19.2866, -99.0047],
  Tlalpan: [19.2915, -99.1668],
  'Venustiano Carranza': [19.4222, -99.1085],
  Xochimilco: [19.2573, -99.1038],
};

export const MODULOS: ModuloAtencion[] = ALCALDIAS.map((alcaldia) => ({
  alcaldia,
  nombre: `Ventanilla Única de Trámites · Alcaldía ${alcaldia}`,
  direccion: DIRECCIONES_ALCALDIA[alcaldia],
  horario: HORARIO_VUT,
  lat: COORDS[alcaldia][0],
  lng: COORDS[alcaldia][1],
}));

/** Dirección de texto por alcaldía (compatibilidad con el motor). */
export const MODULOS_ALCALDIA: Record<AlcaldiaCDMX, string> = DIRECCIONES_ALCALDIA;

/** UP Mixcoac: punto de respaldo cuando el navegador bloquea el GPS. */
export const UP_MIXCOAC = { lat: 19.3733, lng: -99.1834 };

// ---------------------------------------------------------------------------
// Flujos oficiales (links .cdmx.gob.mx) y radiografía callejera por trámite.
// La radiografía es una referencia curada, ilustrativa: no son citas textuales
// ni se consulta Reddit/X en vivo.
// ---------------------------------------------------------------------------
export interface ExtrasTramite {
  variantes?: string[];
  pasosOficiales: PasoOficial[];
  radiografia: RadiografiaCallejera;
}

const L = {
  llave: { etiqueta: '🔑 Llave CDMX', url: 'https://llave.cdmx.gob.mx' },
  pago: {
    etiqueta: '💳 Pagar línea de captura (Finanzas)',
    url: 'https://data.finanzas.cdmx.gob.mx',
  },
  citasSemovi: {
    etiqueta: '📅 Agendar cita SEMOVI',
    url: 'https://app.semovi.cdmx.gob.mx/citas/',
  },
  seduvi: { etiqueta: '🏙️ Portal SEDUVI', url: 'https://seduvi.cdmx.gob.mx' },
  siapem: { etiqueta: '🏪 SIAPEM', url: 'https://siapem.cdmx.gob.mx' },
  actas: { etiqueta: '📄 Actas en línea', url: 'https://actas.cdmx.gob.mx' },
  suac: {
    etiqueta: '📣 Atención Ciudadana',
    url: 'https://atencionciudadana.cdmx.gob.mx',
  },
};

const FUENTE_RADIOGRAFIA =
  'Fuente: Base de conocimiento curada sobre temas recurrentes en r/MexicoCity y X';

const NOTA_RADIOGRAFIA =
  'Verifica siempre en el sitio oficial antes de acudir.';

export const EXTRAS_TRAMITE: Record<string, ExtrasTramite> = {
  'licencia-tipo-a': {
    variantes: ['Nueva', 'Renovación', 'Digital (renovación en línea, si aplica a tu caso)'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y pago de línea de captura',
        descripcion:
          'Entra con tu Llave CDMX, captura tus datos, genera la línea de captura y págala.',
        enlaces: [L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Examen y validación digital',
        descripcion:
          'Si es licencia nueva, presenta el examen que corresponda. Si renuevas, valida tus datos y tu licencia anterior en línea.',
        enlaces: [L.llave],
      },
      {
        numero: 3,
        titulo: 'Cita y módulo físico más cercano',
        descripcion:
          'Agenda tu cita en el Sistema de Citas de SEMOVI y acude con originales para foto y firma.',
        enlaces: [L.citasSemovi],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'Llega con tu cita impresa o en el celular y con originales; sin cita muchos módulos no te atienden.',
        'Revisa que el comprobante de domicilio sea reciente (máximo 3 meses) y a tu nombre.',
        'Nadie afuera del módulo es autoridad: ignora a quienes ofrecen "adelantar" tu cita.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
  'tarjeta-circulacion': {
    variantes: ['Renovación de vigencia (en línea)', 'Reposición por pérdida, robo o deterioro (con cita)'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y pago',
        descripcion: 'Inicia sesión, revisa adeudos y paga tu línea de captura.',
        enlaces: [L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Validación digital del trámite',
        descripcion: 'Captura placa y datos del propietario; descarga tu comprobante.',
        enlaces: [L.llave],
      },
      {
        numero: 3,
        titulo: 'Cita y módulo físico más cercano',
        descripcion: 'Solo para reposición del plástico: agenda cita y acude con originales.',
        enlaces: [L.citasSemovi],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'Antes de pagar, revisa que no tengas multas o adeudos pendientes que bloqueen el trámite.',
        'Lleva el acta o denuncia si perdiste la tarjeta; sin ese papel te regresan.',
        'Paga solo con la línea de captura oficial, nunca por transferencia a terceros.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
  cuzus: {
    variantes: ['Certificado digital de zonificación', 'Uso de suelo comercial para local'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y pago de línea de captura',
        descripcion: 'Ingresa con tu Llave CDMX y paga el derecho con tu línea de captura.',
        enlaces: [L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Solicitud y validación digital en SEDUVI',
        descripcion:
          'Captura la cuenta catastral y la dirección, descarga el certificado y valida su autenticidad.',
        enlaces: [L.seduvi],
      },
      {
        numero: 3,
        titulo: 'Atención presencial si necesitas aclaración',
        descripcion:
          'Si el sistema marca inconsistencias en tu predio, acude a ventanilla con cuenta catastral y escrituras.',
        enlaces: [L.seduvi],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'Consulta primero la zonificación gratis en SIG CiudadMX; así sabes si el giro procede antes de pagar.',
        'La cuenta catastral mal capturada es la causa más común de rechazo.',
        'Desconfía de gestores que prometen "uso de suelo seguro": es el cobro típico de coyotes.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
  'apertura-negocio-bajo-impacto': {
    variantes: ['Aviso de bajo impacto (SIAPEM)'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y consulta de uso de suelo',
        descripcion: 'Crea tu Llave CDMX y confirma que el uso de suelo del local permita tu giro.',
        enlaces: [L.llave, L.seduvi],
      },
      {
        numero: 2,
        titulo: 'Aviso en línea en el SIAPEM',
        descripcion: 'Captura titular, local y giro, adjunta documentos y descarga tu acuse.',
        enlaces: [L.siapem],
      },
      {
        numero: 3,
        titulo: 'Ventanilla de tu alcaldía (si necesitas apoyo)',
        descripcion: 'Conserva el acuse en el local; la ventanilla de la alcaldía te orienta sin costo.',
        enlaces: [L.siapem],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'El aviso de bajo impacto no cuesta: quien te cobre "por evitar clausura" te está estafando.',
        'Ten a la mano el acuse impreso o en el celular durante una visita de verificación.',
        'Si tu giro vende alcohol o tiene aforo alto, deja de ser bajo impacto: confirma tu giro antes.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
  'acta-registro-civil': {
    variantes: ['Acta de nacimiento', 'Acta de matrimonio', 'Acta de defunción'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y pago de línea de captura',
        descripcion: 'Inicia sesión y paga el derecho de la copia certificada.',
        enlaces: [L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Búsqueda y descarga digital del acta',
        descripcion: 'Busca el registro con CURP y descarga el PDF certificado.',
        enlaces: [L.actas],
      },
      {
        numero: 3,
        titulo: 'Módulo del Registro Civil (si no la encuentras en línea)',
        descripcion: 'Acude a un juzgado o módulo con identificación y CURP.',
        enlaces: [L.actas],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'Usa solo el portal oficial: hay páginas clonadas que cobran el doble.',
        'Si el registro es anterior a la digitalización, puede no aparecer; acude a un módulo.',
        'Imprime en papel blanco tamaño carta; el PDF certificado tiene validez con su código.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
  'reporte-suac-locatel': {
    variantes: ['Baches', 'Fugas de agua', 'Luminarias'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Levanta tu reporte',
        descripcion: 'Llama a Locatel (55 5658 1111 o *0311) o reporta en línea con dirección exacta.',
        enlaces: [L.suac],
      },
      {
        numero: 2,
        titulo: 'Guarda tu folio y da seguimiento',
        descripcion: 'Anota el folio y consulta el avance por el mismo canal.',
        enlaces: [L.suac],
      },
      {
        numero: 3,
        titulo: 'Escala en la ventanilla de tu alcaldía',
        descripcion: 'Si no hay respuesta, acude con tu folio a la ventanilla.',
        enlaces: [L.suac],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'Pon calle, entre calles y referencias: los reportes vagos se cierran sin atender.',
        'Adjunta foto y guarda el folio; sin folio no hay seguimiento.',
        'Si pasan varios días, repite el reporte citando el folio anterior.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
};
