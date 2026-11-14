// Base de datos local de trámites de la CDMX (Rol 2).
// Costos: cuotas del Código Fiscal de la Ciudad de México vigentes en 2026.
// Las cuotas cambian cada ejercicio fiscal; confirmar en finanzas.cdmx.gob.mx antes de pagar.
import type { AgentResponse, AlcaldiaCDMX, CategoriaTramite } from '../types/contract';

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
export const MODULOS_ALCALDIA: Record<AlcaldiaCDMX, string> = {
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
