// Base de datos local de trámites de la CDMX (Rol 2).
// Costos: cuotas del Código Fiscal de la Ciudad de México vigentes en 2026.
// Las cuotas cambian cada ejercicio fiscal; confirmar en finanzas.cdmx.gob.mx antes de pagar.
import type {
  AgentResponse,
  AlcaldiaCDMX,
  CategoriaExplorador,
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
  /** Texto de costo cuando no es una cifra única (p. ej. "Desde $572.00 MXN"). */
  costoTexto?: string;
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

const TRAMITES_BASE: TramiteRecord[] = [
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
    id: 'licencia-permanente',
    nombreTramite: 'Licencia de conducir Tipo A Permanente CDMX',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría de Movilidad (SEMOVI) y Secretaría de Administración y Finanzas',
    requiereLlaveCDMX: true,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'La Licencia Tipo A Permanente se paga una sola vez ($1,500.00 MXN) y ya no se renueva. Se tramita desde celular o computadora. Si nunca has tenido licencia Tipo A en la CDMX debes aprobar un examen teórico digital en línea; si ya tienes antecedente de licencia en la CDMX, el sistema la procesa de forma automática sin examen. Solo se puede tramitar hasta el 31 de diciembre de 2026.',
    pasosAccion: [
      'Entra al portal de trámites de la CDMX con tu Llave CDMX.',
      'Elige "Licencia de conducir Tipo A Permanente" y captura tus datos.',
      'Si no tienes antecedente de licencia Tipo A en la CDMX, presenta el examen teórico digital en línea.',
      'Genera tu línea de captura de $1,500.00 MXN y págala.',
      'Descarga tu licencia y confirma en el sistema si requieres acudir a un módulo por el plástico.',
    ],
    documentosRequeridos: [
      'Llave CDMX activa',
      'Identificación oficial vigente',
      'CURP',
      'Comprobante de domicilio reciente (máximo 3 meses)',
      'Línea de captura pagada ($1,500.00 MXN)',
      'Aprobar el examen teórico digital en línea (solo si no tienes antecedente de licencia Tipo A en la CDMX)',
    ],
    costoMXN: 1500,
    tiempoResolucion:
      'El trámite en línea se resuelve en pocos días (hasta 72 horas según reportes de prensa). Fecha límite para tramitarla: 31 de diciembre de 2026',
    fundamentoNormativo:
      'Ley de Movilidad de la Ciudad de México, Reglamento de Tránsito de la Ciudad de México y Código Fiscal de la Ciudad de México (derechos por licencia permanente)',
    alertaAnticorrupcion:
      'La cuota oficial es de $1,500.00 MXN en una sola exhibición, pagada con línea de captura. Nadie debe cobrarte extra por "acelerar" el examen ni la cita.',
    impactoComunitario: {
      poblacionObjetivo: 'Personas conductoras de automóvil particular en la CDMX',
      ahorroEstimado:
        'Un solo pago de $1,500.00 MXN en lugar de renovar cada 3 años ($1,142.00 MXN por periodo)',
    },
    palabrasClave: [
      'licencia permanente',
      'licencia de conducir permanente',
      'licencia tipo a permanente',
      'permanente',
      'permanent',
      'permanete',
      'permanenete',
      'licencia vitalicia',
      'licencia definitiva',
      'de por vida',
      'sin renovar',
      'que no se renueve',
      'no renovar la licencia',
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
      'La licencia Tipo A de 3 años ($1,142.00 MXN) es para conducir automóvil particular en la CDMX. Se expide, renueva o repone con vigencia de tres años. Si prefieres pagar una sola vez, existe la Licencia Permanente ($1,500.00 MXN). Haces el registro y el pago en línea y acudes a un módulo de SEMOVI con tu cita para la toma de fotografía y firma.',
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
      'renovar tarjeta',
      'reposicion de tarjeta',
      'perdi la tarjeta',
      'me robaron la tarjeta',
      'papeles del carro',
      'papeles del coche',
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
  notaModulo?: string;
  pasosOficiales: PasoOficial[];
  radiografia: RadiografiaCallejera;
}

// Únicamente URLs oficiales confirmadas para la demo.
export const URL_OFICIALES = {
  tramites: 'https://tramites.cdmx.gob.mx/',
  llave: 'https://llave.cdmx.gob.mx/',
  citasSemovi: 'https://app.semovi.cdmx.gob.mx/citas/',
  finanzas: 'https://www.finanzas.cdmx.gob.mx/',
  siapem: 'https://siapem.cdmx.gob.mx/',
  seduvi: 'https://www.seduvi.cdmx.gob.mx/',
  atencionCiudadana: 'https://atencionciudadana.cdmx.gob.mx/',
  registroCivil: 'https://www.rcivil.cdmx.gob.mx/',
  ubicaModuloIne: 'https://ubicatumodulo.ine.mx/',
  verificentros: 'https://verificentros.sedema.cdmx.gob.mx/',
  estrados: 'https://estrados.cdmx.gob.mx/',
  sacmex: 'https://aplicaciones.sacmex.cdmx.gob.mx/',
  consejeria: 'https://consejeria.cdmx.gob.mx/',
  sat: 'https://www.sat.gob.mx/',
  sedena: 'https://www.gob.mx/sedena',
} as const;

const L = {
  tramites: { etiqueta: '🏛️ Portal de Trámites CDMX', url: URL_OFICIALES.tramites },
  llave: { etiqueta: '🔑 Llave CDMX', url: URL_OFICIALES.llave },
  pago: { etiqueta: '💳 Pagos y líneas de captura (Finanzas)', url: URL_OFICIALES.finanzas },
  citasSemovi: { etiqueta: '📅 Agendar cita SEMOVI', url: URL_OFICIALES.citasSemovi },
  seduvi: { etiqueta: '🏙️ Portal SEDUVI', url: URL_OFICIALES.seduvi },
  siapem: { etiqueta: '🏪 SIAPEM', url: URL_OFICIALES.siapem },
  actas: { etiqueta: '📄 Registro Civil CDMX', url: URL_OFICIALES.registroCivil },
  suac: { etiqueta: '📣 Atención Ciudadana / Locatel', url: URL_OFICIALES.atencionCiudadana },
  ine: { etiqueta: '🪪 Ubica tu módulo INE', url: URL_OFICIALES.ubicaModuloIne },
  verificentros: { etiqueta: '🌫️ Verificentros y citas (SEDEMA)', url: URL_OFICIALES.verificentros },
  estrados: { etiqueta: '📋 Consulta de infracciones (Estrados)', url: URL_OFICIALES.estrados },
  sacmex: { etiqueta: '💧 Servicios SACMEX', url: URL_OFICIALES.sacmex },
  consejeria: { etiqueta: '📜 Consejería Jurídica (RPPC)', url: URL_OFICIALES.consejeria },
  sat: { etiqueta: '🧾 SAT: RFC y e.firma', url: URL_OFICIALES.sat },
  sedena: { etiqueta: '🎖️ Servicio Militar Nacional', url: URL_OFICIALES.sedena },
};

const FUENTE_RADIOGRAFIA =
  'Fuente: Base de conocimiento curada sobre temas recurrentes en r/MexicoCity y X';

const NOTA_RADIOGRAFIA =
  'Verifica siempre en el sitio oficial antes de acudir.';

export const EXTRAS_TRAMITE: Record<string, ExtrasTramite> = {
  'licencia-permanente': {
    variantes: [
      'Primera vez en CDMX: examen teórico digital en línea',
      'Con antecedente de licencia Tipo A en CDMX: trámite automático sin examen',
    ],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y pago de línea de captura ($1,500.00 MXN)',
        descripcion:
          'Entra al portal de trámites con tu Llave CDMX, elige Licencia Permanente y paga tu línea de captura.',
        enlaces: [L.tramites, L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Examen teórico digital o validación automática',
        descripcion:
          'Sin antecedente de licencia Tipo A en CDMX: presenta el examen teórico en línea. Con antecedente: el sistema valida tu historial de forma automática.',
        enlaces: [L.tramites],
      },
      {
        numero: 3,
        titulo: 'Cita (si el sistema la pide) y módulo físico más cercano',
        descripcion:
          'Si necesitas acudir por tu licencia, agenda en el Sistema de Citas de SEMOVI. Recuerda que la permanente solo se tramita hasta el 31 de diciembre de 2026.',
        enlaces: [L.citasSemovi],
        muestraModulo: true,
      },
    ],
    radiografia: {
      fuente: FUENTE_RADIOGRAFIA,
      advertencias: [
        'Hay una fecha límite: la permanente solo se tramita hasta el 31 de diciembre de 2026; no esperes a diciembre.',
        'El examen teórico es en línea; estudia el reglamento antes de pagar para no repetirlo.',
        'Desconfía de páginas que cobran más de $1,500.00 MXN: solo paga con línea de captura oficial.',
      ],
      nota: NOTA_RADIOGRAFIA,
    },
  },
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

// ===========================================================================
// CATÁLOGO AMPLIADO: licencias especiales, menores, INE, vehículos, casa y guía de 18 años.
// Cifras tomadas de fuentes oficiales y prensa 2026 (Finanzas CDMX, SEMOVI). Confirma el monto
// vigente en tu línea de captura antes de pagar.
// ===========================================================================
const TRAMITES_NUEVOS: TramiteRecord[] = [
  {
    id: 'licencias-especiales',
    nombreTramite: 'Licencias especiales: motociclistas (A1/A2), taxis (B), transporte (C, D y E)',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría de Movilidad (SEMOVI)',
    requiereLlaveCDMX: true,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'Además de la licencia de auto, la CDMX tiene licencias por tipo de vehículo. Tipo A1: motocicleta ($572.00 MXN en 2026 según prensa). Tipo A2: automóvil y motocicleta ($1,142.00 MXN, 3 años). Tipo B: operadores de taxi. Tipo C: transporte de pasajeros ($2,553.00 MXN, 3 años según SEMOVI). Tipos D y E: carga y transporte especializado ($1,700.00 MXN a 2 años o $2,553.00 MXN a 3 años según SEMOVI). Las licencias de transporte son presenciales y piden documentos adicionales.',
    pasosAccion: [
      'Identifica tu tipo de licencia: A1 (moto), A2 (auto y moto), B (taxi), C (pasajeros), D (carga) o E (especializado).',
      'Entra con tu Llave CDMX y genera la línea de captura del tipo que te corresponde.',
      'Paga la línea de captura en línea, en bancos o en tiendas autorizadas.',
      'Agenda tu cita en el Sistema de Citas de SEMOVI y elige un módulo.',
      'Acude con tus originales; para tipos B, C, D y E lleva además los documentos de operador que pida SEMOVI.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente con fotografía',
      'Comprobante de domicilio reciente (máximo 3 meses)',
      'CURP',
      'Línea de captura pagada del tipo de licencia',
      'Licencia anterior (en renovación o reposición)',
      'Constancia o examen médico y documentos de operador (solo tipos B, C, D y E; SEMOVI indica la lista según el tipo)',
    ],
    costoMXN: 572,
    costoTexto:
      'A1: $572.00 MXN · A2: $1,142.00 MXN · C: $2,553.00 MXN · D/E: $1,700.00 (2 años) o $2,553.00 MXN (3 años). Tipo B: consulta tu línea de captura.',
    tiempoResolucion: 'Se entrega en la cita en módulo; los tipos de transporte pueden pedir validaciones adicionales',
    fundamentoNormativo:
      'Ley de Movilidad de la Ciudad de México, Reglamento de Tránsito de la Ciudad de México y Código Fiscal de la Ciudad de México (derechos por licencias)',
    alertaAnticorrupcion:
      'Las cuotas las fija el Código Fiscal y se pagan solo con línea de captura. Ningún "gestor" de taxis o transporte puede garantizarte la licencia a cambio de dinero.',
    impactoComunitario: {
      poblacionObjetivo: 'Motociclistas, operadores de taxi y conductores de transporte público y de carga',
      ahorroEstimado: 'Evita pagos a gestores y multas por conducir con la licencia equivocada',
    },
    palabrasClave: [
      'licencia de moto',
      'licencia para moto',
      'licencia de motocicleta',
      'licencia de motociclista',
      'sacar licencia de moto',
      'motocicleta',
      'moto',
      'a1',
      'a2',
      'licencia de taxi',
      'licencia para taxi',
      'taxista',
      'taxi',
      'tipo b',
      'licencia tipo b',
      'licencia tipo c',
      'licencia tipo d',
      'licencia tipo e',
      'transporte publico',
      'transporte de carga',
      'licencia de carga',
      'licencia de chofer',
      'tarjeton',
      'licencia especial',
      'licencias especiales',
      'licencia de camion',
    ],
  },
  {
    id: 'permiso-menores',
    nombreTramite: 'Permiso de conducir para menores de edad (Tipo "P")',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría de Movilidad (SEMOVI)',
    requiereLlaveCDMX: true,
    modalidad: 'Presencial',
    resumenCiudadano:
      'El permiso Tipo "P" permite conducir a personas menores de edad (la primera vez se pide tener 16 años). Cuesta $508.00 MXN (clave 14). Debes aprobar un curso de manejo en una escuela certificada por SEMOVI, pagar la línea de captura y acudir con tu cita a un Módulo de Control Vehicular y Licencias con tu madre, padre o tutor.',
    pasosAccion: [
      'Toma y aprueba el curso de manejo en una escuela certificada por SEMOVI y guarda la constancia original.',
      'Genera y paga la línea de captura de $508.00 MXN (clave 14).',
      'Agenda tu cita en el Sistema de Citas de SEMOVI y elige un módulo.',
      'Acude con tu madre, padre o tutor y todos los documentos en original y copia.',
      'Toma de fotografía y firma, y recibe tu permiso en el módulo.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente de la madre, padre o tutor (credencial para votar, pasaporte, cédula profesional o Cartilla del SMN)',
      'Comprobante de domicilio de la CDMX o del Estado de México (máximo 3 meses) o credencial con domicilio completo',
      'Constancia original del curso de manejo (escuela certificada por SEMOVI)',
      'Acta de nacimiento de la persona menor de edad (sin tachaduras ni enmendaduras)',
      'Identificación con fotografía de la persona menor (credencial escolar, pasaporte vigente o de dependencia oficial)',
      'Línea de captura pagada ($508.00 MXN, clave 14)',
      'Autorización de la madre, padre o tutor (confirma el formato exacto al generar tu cita)',
    ],
    costoMXN: 508,
    tiempoResolucion: 'Se entrega el mismo día de la cita en el módulo',
    fundamentoNormativo:
      'Ley de Movilidad y Reglamento de Tránsito de la Ciudad de México; Código Fiscal de la Ciudad de México (derechos por permiso para menores)',
    alertaAnticorrupcion:
      'El costo oficial es $508.00 MXN con línea de captura. Verifica que tu escuela de manejo esté en la lista certificada de SEMOVI antes de pagar el curso.',
    impactoComunitario: {
      poblacionObjetivo: 'Adolescentes de 16 y 17 años y sus familias',
      ahorroEstimado: 'Evita multas y retención del vehículo por manejar siendo menor sin permiso',
    },
    palabrasClave: [
      'permiso de conducir para menores',
      'permiso para menores',
      'permiso de manejo para menores',
      'licencia para menores',
      'licencia de menor',
      'licencia para adolescentes',
      'menor de edad',
      'menores de edad',
      'permiso tipo p',
      'mi hijo maneje',
      'mi hijo quiere manejar',
      'mi hija quiere manejar',
      'manejar siendo menor',
      '16 anos',
      '17 anos',
      '15 anos',
      'curso de manejo',
      'carta responsiva',
    ],
  },
  {
    id: 'ine',
    nombreTramite: 'INE: credencial para votar (primera vez, reposición o cambio de domicilio)',
    categoria: 'Identidad y Registro Civil',
    dependencia: 'Instituto Nacional Electoral (INE)',
    requiereLlaveCDMX: false,
    modalidad: 'Presencial',
    resumenCiudadano:
      'La credencial para votar del INE es gratuita. Se tramita en un módulo del INE (no en la alcaldía) con cita: primera vez, reposición por pérdida o robo, y cambio de domicilio. Ubica el módulo más cercano en el sitio oficial del INE o llama a INETEL al 800 433 2000.',
    pasosAccion: [
      'Ubica tu módulo INE más cercano en ubicatumodulo.ine.mx.',
      'Agenda tu cita por el medio que indique el INE (o por INETEL, 800 433 2000).',
      'Reúne tus documentos originales y acude puntual a tu cita.',
      'Captura de huellas, fotografía y firma en el módulo.',
      'Recibe tu comprobante y tu credencial según el plazo que te indiquen.',
    ],
    documentosRequeridos: [
      'Acta de nacimiento original (primera vez)',
      'Identificación con fotografía (credencial escolar, pasaporte, cartilla u otra que acepte el INE)',
      'Comprobante de domicilio reciente (máximo 3 meses)',
      'CURP (recomendable llevarla)',
      'Credencial anterior o denuncia/acta (reposición o cambio de domicilio, según el caso)',
    ],
    costoMXN: 0,
    tiempoResolucion: 'Comprobante inmediato en el módulo; la credencial se entrega en los días posteriores según el INE',
    fundamentoNormativo: 'Ley General de Instituciones y Procedimientos Electorales (credencial para votar)',
    alertaAnticorrupcion:
      'La credencial del INE es gratuita. Nadie puede cobrarte por la cita ni por "adelantarla".',
    impactoComunitario: {
      poblacionObjetivo: 'Personas de 18 años o más que necesitan credencial o actualizar su domicilio',
      ahorroEstimado: 'Trámite gratuito; evita pagar a gestores o "citas" falsas',
    },
    palabrasClave: [
      'ine',
      'ife',
      'credencial para votar',
      'credencial de elector',
      'credencial electoral',
      'credencial del ine',
      'sacar mi ine',
      'sacar el ine',
      'renovar ine',
      'perdi mi ine',
      'cambio de domicilio ine',
      'modulo ine',
      'tramitar ine',
      'instituto nacional electoral',
    ],
  },
  {
    id: 'verificacion-vehicular',
    nombreTramite: 'Verificación vehicular y verificentros CDMX',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría del Medio Ambiente (SEDEMA)',
    requiereLlaveCDMX: false,
    modalidad: 'Presencial',
    resumenCiudadano:
      'La verificación se hace cada semestre según el color de engomado (último dígito de la placa). Costo 2026: $765.45 MXN (5.625 UMA más IVA) para todos los hologramas. Calendario: placas 5 y 6 (amarillo): enero-febrero y julio-agosto; 7 y 8 (rosa): febrero-marzo y agosto-septiembre; 3 y 4 (rojo): marzo-abril y septiembre-octubre; 1 y 2 (verde): abril-mayo y octubre-noviembre; 9 y 0 (azul): mayo-junio y noviembre-diciembre.',
    pasosAccion: [
      'Revisa el último dígito de tu placa y el periodo que te toca en el calendario semestral.',
      'Entra al portal de verificentros de SEDEMA y agenda tu cita en el centro que prefieras.',
      'Lleva tu vehículo, tarjeta de circulación e identificación al verificentro en tu cita.',
      'Paga el derecho ($765.45 MXN en 2026) y realiza la prueba.',
      'Recibe tu holograma y constancia; si no apruebas, revisa el motor y regresa dentro del plazo que indique el verificentro.',
    ],
    documentosRequeridos: [
      'Tarjeta de circulación vigente',
      'Identificación oficial vigente',
      'Comprobante de verificación anterior (si lo tienes)',
      'Pago del derecho de verificación ($765.45 MXN en 2026)',
      'Cita agendada en un verificentro',
    ],
    costoMXN: 765.45,
    tiempoResolucion: 'La prueba se realiza el mismo día de tu cita',
    fundamentoNormativo:
      'Programa de Verificación Vehicular Obligatoria de la Ciudad de México (SEDEMA) y Código Fiscal de la Ciudad de México',
    alertaAnticorrupcion:
      'El costo es el mismo para todos los hologramas. Si alguien te ofrece "pasar" la prueba o un holograma sin verificar, es corrupción: denuncia en Locatel o Contraloría.',
    impactoComunitario: {
      poblacionObjetivo: 'Personas propietarias de vehículos con placas de la CDMX',
      ahorroEstimado: 'Evita multas por no verificar a tiempo y el pago de hologramas falsos',
    },
    palabrasClave: [
      'verificacion',
      'verificar',
      'verificentro',
      'verificentros',
      'verificacion vehicular',
      'verifico',
      'holograma',
      'hologramas',
      'engomado',
      'calendario de verificacion',
      'toca verificar',
      'placa termina',
      'termina en',
      'terminacion de placa',
      'ultimo digito',
      'hoy no circula',
      'verificasion',
      'berificar',
    ],
  },
  {
    id: 'refrendo-tenencia',
    nombreTramite: 'Refrendo y tenencia vehicular CDMX',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Secretaría de Administración y Finanzas (SAF) CDMX',
    requiereLlaveCDMX: false,
    modalidad: '100% Digital',
    resumenCiudadano:
      'El refrendo 2026 cuesta $760.00 MXN. Al pagarlo a tiempo, la tenencia tuvo subsidio del 100% para autos de hasta $638,000 MXN de valor factura con IVA (motocicletas, hasta $250,000 MXN). El tope de $250,000 que mucha gente recuerda es el anterior. Ese plazo para 2026 ya venció (se amplió hasta junio), así que ahora se paga con recargos; para 2027 Finanzas anuncia las reglas en enero.',
    pasosAccion: [
      'Consulta tus adeudos con tu placa en el portal de Finanzas CDMX.',
      'Genera tu línea de captura de refrendo (y de tenencia si no aplica subsidio).',
      'Paga en línea con tarjeta o en bancos, tiendas y cajas autorizadas.',
      'Descarga tu comprobante de pago.',
      'Para el siguiente año, paga el refrendo dentro de los primeros meses (antes del 31 de marzo) para conservar el subsidio si se mantiene.',
    ],
    documentosRequeridos: [
      'Número de placa del vehículo',
      'Número de serie (NIV) o número de motor, si el sistema lo pide',
      'Tarjeta de circulación vigente',
      'Factura original o valor factura del vehículo (para el cálculo y el subsidio)',
      'Medio de pago (tarjeta o línea de captura)',
    ],
    costoMXN: 760,
    costoTexto: 'Refrendo 2026: $760.00 MXN (tenencia: según valor factura; subsidio del 100% hasta $638,000 MXN con IVA, plazo 2026 vencido)',
    tiempoResolucion: 'Comprobante inmediato al pagar en línea',
    fundamentoNormativo:
      'Código Fiscal de la Ciudad de México (derecho de refrendo, art. 219, e impuesto sobre tenencia o uso de vehículos) y acuerdos de subsidio de la Jefatura de Gobierno',
    alertaAnticorrupcion:
      'Paga solo en el portal de Finanzas CDMX o en cajas autorizadas. Desconfía de páginas que prometen "exentar tu tenencia" a cambio de un pago adicional.',
    impactoComunitario: {
      poblacionObjetivo: 'Personas propietarias de vehículos con placas de la CDMX',
      ahorroEstimado: 'Hasta el 100% de la tenencia si se cumplen las reglas del subsidio del año',
    },
    palabrasClave: [
      'refrendo',
      'tenencia',
      'pagar tenencia',
      'pagar mi tenencia',
      'subsidio de tenencia',
      'exento de tenencia',
      'exentar tenencia',
      'tenencia gratis',
      'impuesto vehicular',
      'pagar refrendo',
      'refrendo vehicular',
      'tenensia',
      'refrenso',
    ],
  },
  {
    id: 'fotocivicas-infracciones',
    nombreTramite: 'Consulta de fotocívicas e infracciones de tránsito',
    categoria: 'Movilidad y Vehículos (SEMOVI)',
    dependencia: 'Juzgados Cívicos / Secretaría de Seguridad Ciudadana y Finanzas CDMX',
    requiereLlaveCDMX: false,
    modalidad: '100% Digital',
    resumenCiudadano:
      'Puedes consultar gratis si tu vehículo tiene fotocívicas o infracciones en los Estrados Electrónicos de la CDMX con tu placa. Si tienes adeudos, el sistema muestra el monto a pagar y puedes pagar con línea de captura en Finanzas CDMX. Si no estás de acuerdo con una multa, puedes impugnarla.',
    pasosAccion: [
      'Entra a los Estrados Electrónicos de la CDMX y captura tu placa.',
      'Revisa las fotocívicas o infracciones registradas y sus fechas.',
      'Genera tu línea de captura y paga en Finanzas CDMX (en línea, bancos o tiendas).',
      'Descarga tu comprobante de pago.',
      'Si crees que la multa es injusta, presenta tu aclaración o impugnación en el juzgado cívico que corresponda.',
    ],
    documentosRequeridos: [
      'Número de placa del vehículo',
      'Tarjeta de circulación (para aclaraciones)',
      'Identificación oficial vigente',
      'Línea de captura (si pagas)',
    ],
    costoMXN: 0,
    costoTexto: 'La consulta es gratuita; el monto de la multa depende de la infracción',
    tiempoResolucion: 'Consulta inmediata en línea',
    fundamentoNormativo:
      'Reglamento de Tránsito de la Ciudad de México y Código Fiscal de la Ciudad de México (multas y sanciones)',
    alertaAnticorrupcion:
      'Nunca pagues una multa "en efectivo" a una persona en la calle. Se paga solo con línea de captura oficial.',
    impactoComunitario: {
      poblacionObjetivo: 'Personas conductoras y propietarias de vehículos',
      ahorroEstimado: 'Evita recargos por adeudos y pagos a intermediarios',
    },
    palabrasClave: [
      'fotocivica',
      'fotocivicas',
      'foto civica',
      'fotomulta',
      'fotomultas',
      'infraccion',
      'infracciones',
      'multa',
      'multas',
      'multa de transito',
      'consultar multas',
      'tengo multas',
      'estrados',
      'adeudos vehiculares',
      'adeudos de mi carro',
    ],
  },
  {
    id: 'agua-sacmex',
    nombreTramite: 'Recibo de agua SACMEX (consulta, pago y reportes)',
    categoria: 'Vivienda y Uso de Suelo (SEDUVI)',
    dependencia: 'Sistema de Aguas de la Ciudad de México (SACMEX)',
    requiereLlaveCDMX: false,
    modalidad: '100% Digital',
    resumenCiudadano:
      'Con tu número de cuenta de agua puedes consultar tu saldo, descargar tu boleta y pagar en línea en las aplicaciones de SACMEX. Para reportar falta de agua, fugas o mala calidad, usa Locatel o Atención Ciudadana. Las personas adultas mayores de 60 años pueden tener descuento del 50% en agua según los beneficios fiscales de Finanzas CDMX.',
    pasosAccion: [
      'Ten a la mano tu número de cuenta de agua (viene en tu boleta) o la dirección del inmueble.',
      'Entra a las aplicaciones de SACMEX y consulta tu saldo y bimestres pendientes.',
      'Descarga tu boleta y genera tu línea de captura.',
      'Paga en línea con tarjeta o en bancos y cajas autorizadas.',
      'Para falta de agua o fugas, reporta en Locatel (55 5658 1111) o en Atención Ciudadana y guarda tu folio.',
    ],
    documentosRequeridos: [
      'Número de cuenta de agua (o dirección del inmueble)',
      'Boleta anterior (opcional)',
      'Identificación oficial (para aclaraciones o descuentos)',
      'Comprobante de edad (si solicitas el beneficio para adultos mayores)',
    ],
    costoMXN: 0,
    costoTexto: 'Según tu consumo y tarifa; consulta el monto exacto de tu boleta',
    tiempoResolucion: 'Consulta y pago inmediatos en línea; los reportes de fugas dependen del área responsable',
    fundamentoNormativo:
      'Ley de Aguas del Distrito Federal y Código Fiscal de la Ciudad de México (derechos por suministro de agua)',
    alertaAnticorrupcion:
      'Paga solo con la boleta o línea de captura oficial. Nadie debe cobrarte por "no cortarte el servicio" ni por atender una fuga.',
    impactoComunitario: {
      poblacionObjetivo: 'Hogares y negocios con toma de agua en la CDMX',
      ahorroEstimado: 'Evita recargos por pagos atrasados y descuentos para personas adultas mayores',
    },
    palabrasClave: [
      'recibo del agua',
      'recibo de agua',
      'boleta del agua',
      'boleta de agua',
      'sacmex',
      'saldo del agua',
      'saldo de agua',
      'pagar el agua',
      'pagar mi agua',
      'cuenta del agua',
      'numero de cuenta de agua',
      'adeudo de agua',
      'consumo de agua',
      'cobro de agua',
      'checar el agua',
      'mi recibo del agua',
    ],
  },
  {
    id: 'predial',
    nombreTramite: 'Pago de Predial CDMX',
    categoria: 'Vivienda y Uso de Suelo (SEDUVI)',
    dependencia: 'Secretaría de Administración y Finanzas (SAF) CDMX',
    requiereLlaveCDMX: false,
    modalidad: '100% Digital',
    resumenCiudadano:
      'El predial se paga con tu cuenta catastral. Si pagas todo el año por adelantado tienes 8% de descuento en enero y 5% en febrero (según los beneficios 2026 de Finanzas). Personas de 60 años o más y grupos vulnerables pueden tener cuota fija de $68.00 MXN bimestral o hasta 30% de descuento según el valor catastral.',
    pasosAccion: [
      'Ubica tu cuenta catastral (viene en tu boleta predial).',
      'Entra al portal de Finanzas CDMX y consulta tu adeudo.',
      'Elige pago bimestral o anual anticipado para aprovechar el descuento.',
      'Genera tu línea de captura y paga en línea, bancos o tiendas autorizadas.',
      'Si eres persona adulta mayor, solicita tu beneficio con tu identificación y comprobante de domicilio.',
    ],
    documentosRequeridos: [
      'Cuenta catastral del inmueble',
      'Identificación oficial vigente',
      'Comprobante de domicilio (si solicitas beneficio)',
      'Comprobante de edad (adultos mayores)',
      'Línea de captura pagada',
    ],
    costoMXN: 0,
    costoTexto: 'Según valor catastral; descuento de 8% (enero) o 5% (febrero) por pago anual anticipado',
    tiempoResolucion: 'Comprobante inmediato al pagar en línea',
    fundamentoNormativo:
      'Código Fiscal de la Ciudad de México (Impuesto Predial) y programas de beneficios fiscales de la SAF',
    alertaAnticorrupcion:
      'Los descuentos son oficiales y automáticos al pagar a tiempo. No pagues a gestores que "consiguen descuentos especiales".',
    impactoComunitario: {
      poblacionObjetivo: 'Propietarias y propietarios de inmuebles en la CDMX',
      ahorroEstimado: 'Hasta 8% por pago anual anticipado y apoyos para adultos mayores',
    },
    palabrasClave: [
      'predial',
      'pagar predial',
      'pagar el predial',
      'boleta predial',
      'impuesto predial',
      'descuento predial',
      'predial adultos mayores',
      'predial 2026',
      'predial 2027',
      'predail',
      'predal',
    ],
  },
  {
    id: 'escrituras-rppc',
    nombreTramite: 'Escrituras, folio real y Registro Público de la Propiedad (RPPC)',
    categoria: 'Vivienda y Uso de Suelo (SEDUVI)',
    dependencia: 'Consejería Jurídica y de Servicios Legales / Registro Público de la Propiedad y de Comercio',
    requiereLlaveCDMX: true,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'Para escriturar, heredar o comprobar a nombre de quién está una propiedad necesitas el folio real y, a veces, una constancia o copia certificada del Registro Público de la Propiedad. La Jornada Notarial 2026 de la CDMX ofrece descuentos en escrituras (entre 10% y hasta 60% según el valor del inmueble), testamentos y sucesiones, vigente hasta el 31 de diciembre de 2026. Los talones se tramitan en la Dirección General de Regulación Territorial.',
    pasosAccion: [
      'Reúne tu escritura o datos del inmueble y ubica su folio real.',
      'Consulta o solicita tu constancia de folio real en los servicios electrónicos del Registro Público de la Propiedad (Consejería Jurídica).',
      'Para aprovechar la Jornada Notarial, tramita tu talón de descuento y elige un notario participante.',
      'Paga los derechos con línea de captura oficial.',
      'Firma ante notario y verifica que tu escritura quede inscrita en el RPPC.',
    ],
    documentosRequeridos: [
      'Identificación oficial vigente',
      'Escritura, título o documento que acredite la propiedad',
      'Boleta predial reciente y cuenta catastral',
      'CURP y comprobante de domicilio',
      'Folio real del inmueble (o datos para ubicarlo)',
      'Talón de descuento de la Jornada Notarial (si aplica)',
    ],
    costoMXN: 0,
    costoTexto:
      'Según el acto y el valor del inmueble; Jornada Notarial 2026: descuentos de 10% a 60% en escrituras y hasta 50% en testamentos. Tarifa de constancias en la lista de trámites 2026 del RPPC.',
    tiempoResolucion: 'Constancias electrónicas en pocos días; escrituración depende del notario y del acto',
    fundamentoNormativo:
      'Código Civil para el Distrito Federal, Ley del Notariado de la Ciudad de México y Código Fiscal de la Ciudad de México (derechos del Registro Público)',
    alertaAnticorrupcion:
      'Los notarios participantes en la Jornada aplican tarifas con descuento oficial. Pide siempre recibo y no entregues dinero a intermediarios que prometen "regularizar sin papeles".',
    impactoComunitario: {
      poblacionObjetivo: 'Familias que quieren regularizar su vivienda o hacer testamento',
      ahorroEstimado: 'Hasta 60% menos en escrituras durante la Jornada Notarial',
    },
    palabrasClave: [
      'escritura',
      'escrituras',
      'escriturar',
      'testamento',
      'jornada notarial',
      'notario',
      'folio real',
      'registro publico de la propiedad',
      'rppc',
      'constancia de folio',
      'regularizar mi casa',
      'regularizar propiedad',
      'comprar casa',
      'compraventa',
      'sucesion',
      'heredar',
      'escritura de mi casa',
    ],
  },
  {
    id: 'guia-18-anos',
    nombreTramite: 'Cumplí 18 años: mis primeros trámites',
    categoria: 'Identidad y Registro Civil',
    dependencia: 'INE, Gobierno CDMX, SAT, SEDENA y SEMOVI',
    requiereLlaveCDMX: true,
    modalidad: 'Híbrido',
    resumenCiudadano:
      'Al cumplir 18 años conviene hacer cinco trámites en este orden: 1) INE, 2) Llave CDMX, 3) RFC y e.firma en el SAT, 4) Cartilla del Servicio Militar Nacional (obligatoria para hombres, voluntaria para mujeres) en la Junta de Reclutamiento de tu alcaldía y 5) tu primera licencia de conducir (Tipo A de 3 años $1,142.00 MXN o permanente $1,500.00 MXN hasta el 31 de diciembre de 2026).',
    pasosAccion: [
      'INE: agenda tu cita y acude a un módulo con acta de nacimiento, identificación con foto y comprobante de domicilio.',
      'Llave CDMX: crea tu cuenta con CURP, correo y celular; la usarás en casi todos los trámites digitales.',
      'RFC y e.firma: obtén tu RFC con tu CURP en el portal del SAT y agenda cita para tu e.firma.',
      'Cartilla del Servicio Militar Nacional: acude a la Junta de Reclutamiento de tu alcaldía con tus documentos (trámite gratuito).',
      'Primera licencia de conducir: paga la línea de captura, presenta el examen que corresponda y agenda tu cita en SEMOVI.',
    ],
    documentosRequeridos: [
      'Acta de nacimiento original',
      'CURP',
      'Identificación con fotografía (credencial escolar o pasaporte)',
      'Comprobante de domicilio reciente (máximo 3 meses)',
      'Correo electrónico y teléfono celular propios (para Llave CDMX y SAT)',
      'Memoria USB (para guardar tu e.firma)',
      'Fotografías tamaño pasaporte (según te indique la Junta de Reclutamiento)',
    ],
    costoMXN: 0,
    costoTexto:
      'INE, Llave CDMX, RFC, e.firma y Cartilla: gratuitos. Primera licencia: $1,142.00 MXN (3 años) o $1,500.00 MXN (permanente)',
    tiempoResolucion: 'Varía por trámite; la Llave CDMX y el RFC se obtienen el mismo día',
    fundamentoNormativo:
      'Constitución Política (art. 31 y 36, obligaciones ciudadanas), Ley del Servicio Militar, Código Fiscal de la Federación (RFC) y Ley de Movilidad de la CDMX',
    alertaAnticorrupcion:
      'INE, RFC, e.firma, Llave CDMX y Cartilla son gratuitos. Si alguien te cobra por conseguir tu cita o "acelerar" estos trámites, es un coyote.',
    impactoComunitario: {
      poblacionObjetivo: 'Jóvenes de la CDMX que acaban de cumplir 18 años',
      ahorroEstimado: 'Evita pagos a gestores y viajes repetidos por documentos faltantes',
    },
    palabrasClave: [
      'cumpli 18',
      'cumpli los 18',
      'cumplir 18',
      '18 anos',
      'acabo de cumplir 18',
      'mayor de edad',
      'mayoria de edad',
      'primeros tramites',
      'que tramites debo hacer',
      'tramites a los 18',
      'cartilla',
      'servicio militar',
      'cartilla militar',
      'efirma',
      'e firma',
      'firma electronica',
      'rfc',
      'sacar mi rfc',
      'sat',
      'ya soy mayor de edad',
    ],
  },
];

/** Orden de prioridad para desempates en la búsqueda (más específicos primero). */
const ORDEN_TRAMITES = [
  'guia-18-anos',
  'licencia-permanente',
  'permiso-menores',
  'licencias-especiales',
  'licencia-tipo-a',
  'verificacion-vehicular',
  'refrendo-tenencia',
  'fotocivicas-infracciones',
  'tarjeta-circulacion',
  'ine',
  'acta-registro-civil',
  'agua-sacmex',
  'predial',
  'escrituras-rppc',
  'cuzus',
  'apertura-negocio-bajo-impacto',
  'reporte-suac-locatel',
];

const TODOS = [...TRAMITES_BASE, ...TRAMITES_NUEVOS];
export const TRAMITES: TramiteRecord[] = [
  ...ORDEN_TRAMITES.map((id) => TODOS.find((t) => t.id === id)).filter(
    (t): t is TramiteRecord => Boolean(t),
  ),
  ...TODOS.filter((t) => !ORDEN_TRAMITES.includes(t.id)),
];

// ---------------------------------------------------------------------------
// Extras de los trámites nuevos: flujo con links oficiales y radiografía callejera.
// ---------------------------------------------------------------------------
const radiografia = (advertencias: string[]): RadiografiaCallejera => ({
  fuente: FUENTE_RADIOGRAFIA,
  advertencias,
  nota: NOTA_RADIOGRAFIA,
});

Object.assign(EXTRAS_TRAMITE, {
  'licencias-especiales': {
    variantes: ['A1: motocicleta', 'A2: auto y moto', 'B: taxi', 'C: pasajeros', 'D/E: carga y especializado'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Llave CDMX y pago de tu línea de captura',
        descripcion: 'Elige el tipo de licencia, genera la línea de captura y págala.',
        enlaces: [L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Validación de datos y documentos',
        descripcion: 'Confirma en el portal de trámites los requisitos de tu tipo de licencia.',
        enlaces: [L.tramites],
      },
      {
        numero: 3,
        titulo: 'Cita y módulo físico más cercano',
        descripcion: 'Agenda en SEMOVI y acude con originales para foto y firma.',
        enlaces: [L.citasSemovi],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Confirma el tipo exacto antes de pagar: pagar la clave equivocada es el error más común.',
      'En licencias de transporte lleva todos los documentos de operador; si falta uno te regresan.',
      'Nadie en la calle puede "asegurar" tu licencia de taxi o transporte.',
    ]),
  },
  'permiso-menores': {
    variantes: ['Primera vez (16 años)', 'Reposición del permiso'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Curso de manejo y línea de captura ($508.00 MXN)',
        descripcion: 'Aprueba el curso en una escuela certificada y paga tu línea de captura (clave 14).',
        enlaces: [L.llave, L.pago],
      },
      {
        numero: 2,
        titulo: 'Reúne la documentación con tu madre, padre o tutor',
        descripcion: 'Acta, identificaciones, comprobante de domicilio y constancia del curso, en original y copia.',
        enlaces: [L.tramites],
      },
      {
        numero: 3,
        titulo: 'Cita en el Módulo de Control Vehicular',
        descripcion: 'Agenda en SEMOVI y acude acompañado de tu madre, padre o tutor.',
        enlaces: [L.citasSemovi],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Verifica que la escuela de manejo esté en la lista certificada de SEMOVI; si no, la constancia no sirve.',
      'Llega con tu madre, padre o tutor y con copias de todo.',
      'El permiso tiene restricciones de horario: revisa las condiciones al recibirlo.',
    ]),
  },
  ine: {
    variantes: ['Primera vez', 'Reposición', 'Cambio de domicilio'],
    notaModulo:
      'Los módulos del INE son distintos a la alcaldía: ubica el más cercano en ubicatumodulo.ine.mx. Esta sede de referencia solo te orienta en tu alcaldía.',
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Ubica tu módulo INE',
        descripcion: 'Busca el módulo más cercano a tu domicilio en el sitio oficial del INE.',
        enlaces: [L.ine],
      },
      {
        numero: 2,
        titulo: 'Agenda tu cita',
        descripcion: 'Agenda por los medios del INE o por INETEL (800 433 2000).',
        enlaces: [L.ine],
      },
      {
        numero: 3,
        titulo: 'Acude con tus documentos',
        descripcion: 'Lleva acta de nacimiento, identificación y comprobante de domicilio originales.',
        enlaces: [L.ine],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Llega 10 minutos antes de tu cita; sin cita las filas suelen ser larguísimas.',
      'El comprobante de domicilio debe tener tu nombre y ser reciente.',
      'Es gratis: no pagues a "coyotes" afuera de los módulos.',
    ]),
  },
  'verificacion-vehicular': {
    variantes: ['Calendario semestral por engomado', 'Cita en verificentro'],
    notaModulo:
      'Los verificentros están autorizados por SEDEMA: ubica el más cercano y agenda tu cita en el portal oficial de verificentros.',
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Revisa tu calendario por último dígito de placa',
        descripcion:
          '5-6 amarillo (ene-feb y jul-ago); 7-8 rosa (feb-mar y ago-sep); 3-4 rojo (mar-abr y sep-oct); 1-2 verde (abr-may y oct-nov); 9-0 azul (may-jun y nov-dic).',
        enlaces: [L.verificentros],
      },
      {
        numero: 2,
        titulo: 'Agenda tu cita en un verificentro',
        descripcion: 'Elige centro, fecha y hora en el portal oficial.',
        enlaces: [L.verificentros],
      },
      {
        numero: 3,
        titulo: 'Acude y paga $765.45 MXN',
        descripcion: 'Lleva tarjeta de circulación e identificación; recibe tu holograma.',
        enlaces: [L.verificentros],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Verifica dentro de tu periodo: fuera de fecha te pueden multar.',
      'Si tu auto no pasa, atiende el motor y regresa dentro del plazo que indique el verificentro.',
      'Nadie puede venderte un holograma sin prueba: es ilegal.',
    ]),
  },
  'refrendo-tenencia': {
    variantes: ['Refrendo 2026: $760.00 MXN', 'Tenencia con subsidio según valor factura'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Consulta tus adeudos con tu placa',
        descripcion: 'Entra al portal de Finanzas CDMX y revisa refrendo, tenencia y multas.',
        enlaces: [L.pago],
      },
      {
        numero: 2,
        titulo: 'Genera tu línea de captura',
        descripcion: 'Refrendo $760.00 MXN (2026). Revisa si te aplica el subsidio de tenencia.',
        enlaces: [L.pago],
      },
      {
        numero: 3,
        titulo: 'Paga y descarga tu comprobante',
        descripcion: 'En línea con tarjeta, en bancos o en cajas autorizadas.',
        enlaces: [L.pago, L.tramites],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Paga el refrendo en los primeros meses del año para conservar el subsidio de tenencia cuando exista.',
      'Revisa que no tengas multas pendientes: pueden bloquear el trámite.',
      'Conserva siempre el comprobante de pago.',
    ]),
  },
  'fotocivicas-infracciones': {
    variantes: ['Consulta gratuita', 'Pago de multa', 'Aclaración o impugnación'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Consulta tu placa en Estrados',
        descripcion: 'Revisa gratis si tienes fotocívicas o infracciones registradas.',
        enlaces: [L.estrados],
      },
      {
        numero: 2,
        titulo: 'Genera y paga tu línea de captura',
        descripcion: 'Paga en Finanzas CDMX en línea, bancos o tiendas autorizadas.',
        enlaces: [L.pago],
      },
      {
        numero: 3,
        titulo: 'Aclaración en juzgado cívico (si aplica)',
        descripcion: 'Si la multa es errónea, presenta tu aclaración con tarjeta de circulación e identificación.',
        enlaces: [L.estrados],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Consulta antes de verificar o pagar refrendo: los adeudos pueden bloquear esos trámites.',
      'Guarda tu comprobante de pago por si el sistema tarda en actualizarse.',
      'Nunca pagues multas en efectivo a una persona en la calle.',
    ]),
  },
  'agua-sacmex': {
    variantes: ['Consulta de saldo', 'Descarga de boleta', 'Reporte de falta de agua o fugas'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Ubica tu número de cuenta',
        descripcion: 'Lo encuentras en tu boleta de agua o con la dirección del inmueble.',
        enlaces: [L.sacmex],
      },
      {
        numero: 2,
        titulo: 'Consulta saldo y descarga tu boleta',
        descripcion: 'Entra a las aplicaciones de SACMEX para ver adeudos y descargar la boleta.',
        enlaces: [L.sacmex],
      },
      {
        numero: 3,
        titulo: 'Paga o reporta',
        descripcion: 'Paga con línea de captura. Para fugas o falta de agua, reporta en Locatel y guarda tu folio.',
        enlaces: [L.pago, L.suac],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Si tu boleta sube mucho, pide revisión del medidor antes de pagar.',
      'Reporta fugas con dirección exacta y foto; sin folio no hay seguimiento.',
      'Adultos mayores: pregunta por el descuento en agua en Finanzas.',
    ]),
  },
  predial: {
    variantes: ['Pago bimestral', 'Pago anual anticipado (8% en enero, 5% en febrero)', 'Beneficio para adultos mayores'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Ubica tu cuenta catastral',
        descripcion: 'Está en tu boleta predial; también puedes consultarla en el portal de Finanzas.',
        enlaces: [L.pago],
      },
      {
        numero: 2,
        titulo: 'Elige cómo pagar',
        descripcion: 'Anual anticipado para el descuento, o bimestral.',
        enlaces: [L.pago],
      },
      {
        numero: 3,
        titulo: 'Paga y conserva tu comprobante',
        descripcion: 'En línea, bancos o tiendas autorizadas.',
        enlaces: [L.pago, L.tramites],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'El descuento solo aplica si pagas los seis bimestres del año por adelantado.',
      'Guarda el comprobante: sirve para trámites de escrituras y créditos.',
      'Adultos mayores: lleva identificación y comprobante de domicilio para pedir tu beneficio.',
    ]),
  },
  'escrituras-rppc': {
    variantes: ['Escrituración', 'Testamento y sucesiones', 'Constancia de folio real'],
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'Ubica tu folio real y tu cuenta catastral',
        descripcion: 'Con tu escritura o boleta predial identifica el inmueble.',
        enlaces: [L.consejeria],
      },
      {
        numero: 2,
        titulo: 'Solicita constancia o copia certificada en el RPPC',
        descripcion: 'Usa los servicios electrónicos de la Consejería Jurídica.',
        enlaces: [L.consejeria, L.pago],
      },
      {
        numero: 3,
        titulo: 'Jornada Notarial y firma ante notario',
        descripcion: 'Tramita tu talón de descuento (vigente hasta el 31 de diciembre de 2026) y elige notario participante.',
        enlaces: [L.consejeria],
        muestraModulo: true,
      },
    ],
    radiografia: radiografia([
      'Pide el costo total por escrito antes de iniciar con el notario.',
      'Aprovecha la Jornada Notarial: termina el 31 de diciembre de 2026.',
      'Desconfía de intermediarios que prometen "regularizar" sin documentos.',
    ]),
  },
  'guia-18-anos': {
    variantes: ['INE', 'Llave CDMX', 'RFC y e.firma (SAT)', 'Cartilla del SMN', 'Primera licencia de conducir'],
    notaModulo:
      'La Cartilla del Servicio Militar se tramita en la Junta de Reclutamiento de tu alcaldía; el INE y el SAT tienen sus propios módulos.',
    pasosOficiales: [
      {
        numero: 1,
        titulo: 'INE (credencial para votar)',
        descripcion: 'Ubica tu módulo, agenda cita y lleva acta, identificación y comprobante de domicilio.',
        enlaces: [L.ine],
      },
      {
        numero: 2,
        titulo: 'Crea tu Llave CDMX',
        descripcion: 'Con CURP, correo y celular; es tu acceso a los trámites digitales de la ciudad.',
        enlaces: [L.llave, L.tramites],
      },
      {
        numero: 3,
        titulo: 'RFC y e.firma en el SAT',
        descripcion: 'Obtén tu RFC con tu CURP y agenda cita para tu e.firma con USB.',
        enlaces: [L.sat],
      },
      {
        numero: 4,
        titulo: 'Cartilla del Servicio Militar Nacional',
        descripcion: 'Acude a la Junta de Reclutamiento de tu alcaldía con tus documentos. Es gratuita.',
        enlaces: [L.sedena],
        muestraModulo: true,
      },
      {
        numero: 5,
        titulo: 'Tu primera licencia de conducir',
        descripcion: 'Tipo A de 3 años ($1,142.00 MXN) o permanente ($1,500.00 MXN, hasta el 31 de diciembre de 2026).',
        enlaces: [L.llave, L.pago, L.citasSemovi],
      },
    ],
    radiografia: radiografia([
      'Empieza por la INE y la Llave CDMX: casi todo lo demás las pide.',
      'Guarda tu e.firma en una USB y respáldala: si la pierdes tendrás que repetir el trámite.',
      'Todos estos trámites son gratuitos excepto la licencia: no pagues a coyotes por las citas.',
    ]),
  },
} as Record<string, ExtrasTramite>);

// ---------------------------------------------------------------------------
// Explorador de categorías (interfaz): sub-trámites listos para consultar en 1 clic.
// ---------------------------------------------------------------------------
export const CATEGORIAS_EXPLORADOR: CategoriaExplorador[] = [
  {
    id: 'licencias',
    icono: '🪪',
    titulo: 'Licencias e Identificaciones',
    descripcion: 'Licencias, permisos de conducir, INE y actas',
    subtramites: [
      {
        tramiteId: 'licencia-permanente',
        etiqueta: 'Licencia Permanente CDMX',
        detalle: '$1,500 MXN · examen teórico digital · hasta dic 2026',
        consulta: '¿Cómo saco la Licencia Permanente CDMX?',
      },
      {
        tramiteId: 'licencia-tipo-a',
        etiqueta: 'Licencia Tipo A (3 años)',
        detalle: '$1,142 MXN · renovación o primera vez',
        consulta: '¿Cómo saco la Licencia Tipo A de 3 años?',
      },
      {
        tramiteId: 'licencias-especiales',
        etiqueta: 'Licencias especiales (A1/A2, B, C, E)',
        detalle: 'Motociclistas, taxis y transporte',
        consulta: '¿Qué requisitos hay para una licencia de moto o de taxi?',
      },
      {
        tramiteId: 'permiso-menores',
        etiqueta: 'Permiso de conducir para menores',
        detalle: '$508 MXN · 16 a 17 años · curso y tutor',
        consulta: '¿Cómo tramito el permiso de conducir para menores de edad?',
      },
      {
        tramiteId: 'ine',
        etiqueta: 'INE (credencial para votar)',
        detalle: 'Gratis · primera vez, reposición o domicilio',
        consulta: '¿Cómo tramito mi INE?',
      },
      {
        tramiteId: 'acta-registro-civil',
        etiqueta: 'Actas del Registro Civil',
        detalle: '$98 MXN · descarga en línea',
        consulta: '¿Cómo saco una copia certificada de mi acta de nacimiento?',
      },
    ],
  },
  {
    id: 'autos',
    icono: '🚗',
    titulo: 'Autos, Verificación, Tenencia y Refrendo',
    descripcion: 'Verificentros, refrendo, multas y tarjeta de circulación',
    subtramites: [
      {
        tramiteId: 'verificacion-vehicular',
        etiqueta: 'Verificación vehicular y verificentros',
        detalle: '$765.45 MXN · calendario por placa',
        consulta: '¿Cuándo me toca verificar mi auto y cuánto cuesta?',
      },
      {
        tramiteId: 'refrendo-tenencia',
        etiqueta: 'Refrendo y tenencia',
        detalle: 'Refrendo 2026: $760 MXN',
        consulta: '¿Cómo pago el refrendo y la tenencia?',
      },
      {
        tramiteId: 'tarjeta-circulacion',
        etiqueta: 'Renovación de tarjeta de circulación',
        detalle: '$433 MXN',
        consulta: '¿Cómo renuevo mi tarjeta de circulación?',
      },
      {
        tramiteId: 'fotocivicas-infracciones',
        etiqueta: 'Fotocívicas e infracciones',
        detalle: 'Consulta gratis con tu placa',
        consulta: '¿Cómo consulto si tengo multas o fotocívicas?',
      },
    ],
  },
  {
    id: 'casa',
    icono: '🏠',
    titulo: 'Casa, Agua, Predial y Escrituras',
    descripcion: 'Recibo de agua, predial, escrituras y reportes',
    subtramites: [
      {
        tramiteId: 'agua-sacmex',
        etiqueta: 'Recibo de agua SACMEX',
        detalle: 'Consulta, pago y reportes de fugas',
        consulta: '¿Cómo checo y pago mi recibo del agua?',
      },
      {
        tramiteId: 'predial',
        etiqueta: 'Pago de Predial',
        detalle: '8% desc. en enero · 5% en febrero',
        consulta: '¿Cómo pago el predial y qué descuentos hay?',
      },
      {
        tramiteId: 'escrituras-rppc',
        etiqueta: 'Escrituras, folio real y RPPC',
        detalle: 'Jornada Notarial: hasta 60% de descuento',
        consulta: '¿Cómo saco mis escrituras o mi folio real y qué es la Jornada Notarial?',
      },
      {
        tramiteId: 'reporte-suac-locatel',
        etiqueta: 'Reportar baches, fugas o luminarias',
        detalle: 'Gratis · Locatel y Atención Ciudadana',
        consulta: '¿Cómo reporto un bache o una luminaria descompuesta?',
      },
    ],
  },
  {
    id: 'negocios',
    icono: '🏪',
    titulo: 'Locales Comerciales y Negocios',
    descripcion: 'Uso de suelo y apertura sin clausuras',
    subtramites: [
      {
        tramiteId: 'cuzus',
        etiqueta: 'Permiso de Uso de Suelo Comercial (SEDUVI)',
        detalle: '$2,104 MXN · certificado digital · sin coyotes',
        consulta: '¿Dónde saco el permiso de uso de suelo comercial para mi local?',
      },
      {
        tramiteId: 'apertura-negocio-bajo-impacto',
        etiqueta: 'Aviso de apertura de bajo impacto (SIAPEM)',
        detalle: 'Gratis · en línea con Llave CDMX',
        consulta: 'Quiero abrir una cafetería y que no me clausuren',
      },
    ],
  },
  {
    id: 'mayoria-edad',
    icono: '🎓',
    titulo: 'Cumplí 18 años: Mis primeros trámites',
    descripcion: 'INE, Llave CDMX, RFC, Cartilla y primera licencia',
    destacada: true,
    insignia: '⭐ Para jóvenes de 18',
    subtramites: [
      {
        tramiteId: 'guia-18-anos',
        etiqueta: 'Ruta guiada de 5 pasos',
        detalle: 'INE · Llave CDMX · SAT · Cartilla · Licencia',
        consulta: 'Ya cumplí 18 años, ¿qué trámites debo hacer?',
      },
    ],
  },
];
