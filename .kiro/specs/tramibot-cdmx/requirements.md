# Requirements Document

## Introduction

TrámiBot CDMX es una aplicación web (Agente Ciudadano de Trámites de la CDMX) construida con Vite, React, TypeScript y TailwindCSS, que se inicia con `npm run dev`. La interfaz está en español y no usa ningún LLM externo: toda la inteligencia se ejecuta localmente mediante normalización de texto y herramientas locales sobre una base de datos de trámites. El trabajo se divide en cuatro roles: Rol 1 (agentEngine), Rol 2 (cdmxData), Rol 3 (UI) y Rol 4 (demoCases). Los tipos compartidos viven en `src/types/contract.ts`. La última tarea del plan es el commit y push a `main`.

## Glossary

- **TramiBot_App**: Aplicación web TrámiBot CDMX completa.
- **Contract**: Módulo `src/types/contract.ts` que conserva AgentContract, DataContract y UiContract y agrega AlcaldiaCDMX, CategoriaTramite, AgentRequest y AgentResponse.
- **AlcaldiaCDMX**: Tipo unión de las 16 alcaldías: Álvaro Obregón, Azcapotzalco, Benito Juárez, Coyoacán, Cuajimalpa de Morelos, Cuauhtémoc, Gustavo A. Madero, Iztacalco, Iztapalapa, La Magdalena Contreras, Miguel Hidalgo, Milpa Alta, Tláhuac, Tlalpan, Venustiano Carranza, Xochimilco.
- **CategoriaTramite**: Tipo unión: 'Negocios y Comercio (SIAPEM)', 'Movilidad y Vehículos (SEMOVI)', 'Vivienda y Uso de Suelo (SEDUVI)', 'Identidad y Registro Civil', 'Atención Ciudadana (SUAC)'.
- **AgentRequest**: Tipo con los campos id: string, consultaCiudadana: string, alcaldia: AlcaldiaCDMX y categoria opcional de tipo CategoriaTramite.
- **AgentResponse**: Tipo con los campos id, nombreTramite, dependencia, requiereLlaveCDMX (boolean), modalidad ('100% Digital' | 'Híbrido' | 'Presencial'), resumenCiudadano, pasosAccion (string[]), documentosRequeridos (string[]), costoOficialMXN, tiempoResolucion, fundamentoNormativo, alertaAnticorrupcion, ubicacionModuloAlcaldia e impactoComunitario (con poblacionObjetivo y ahorroEstimado).
- **CdmxData**: Módulo `src/data/cdmxData.ts` (Rol 2) con la base de trámites.
- **AgentEngine**: Módulo `src/agent/agentEngine.ts` (Rol 1) que procesa consultas y devuelve AgentResponse.
- **DemoCases**: Módulo `src/data/demoCases.ts` (Rol 4) con los escenarios de demostración.
- **DashboardCiudadano**: Componente `src/components/DashboardCiudadano.tsx` (Rol 3).
- **App_Shell**: Componente `src/App.tsx` (Rol 3).
- **Normalizador**: Función del AgentEngine que convierte texto coloquial en texto comparable (minúsculas, sin acentos, sin errores de dedo).
- **Llave_CDMX**: Credencial digital de la Ciudad de México requerida por ciertos trámites en línea.
- **Herramienta_Local**: Función del AgentEngine que consulta CdmxData sin usar servicios externos.

## Requirements

### Requirement 1

**User Story:** Como desarrollador de cualquier rol, quiero un contrato de tipos compartido, para que los cuatro módulos se integren sin inventar campos.

#### Acceptance Criteria

1. THE Contract SHALL conservar las interfaces AgentContract, DataContract y UiContract.
2. THE Contract SHALL exportar el tipo AlcaldiaCDMX con exactamente las 16 alcaldías definidas en el Glosario.
3. THE Contract SHALL exportar el tipo CategoriaTramite con exactamente los cinco valores definidos en el Glosario.
4. THE Contract SHALL exportar la interfaz AgentRequest con exactamente los campos id, consultaCiudadana, alcaldia y categoria opcional.
5. THE Contract SHALL exportar la interfaz AgentResponse con exactamente los campos definidos en el Glosario.
6. THE Contract SHALL definir el campo modalidad de AgentResponse como la unión '100% Digital' | 'Híbrido' | 'Presencial'.

### Requirement 2

**User Story:** Como ciudadano, quiero información oficial y veraz de los trámites, para evitar errores y pagos indebidos.

#### Acceptance Criteria

1. THE CdmxData SHALL contener los trámites: apertura de negocio de bajo impacto (SIAPEM), Licencia Tipo A y Tarjeta de Circulación (SEMOVI), Certificado Único de Zonificación de Uso de Suelo (SEDUVI), actas certificadas del Registro Civil y Reporte SUAC/Locatel.
2. THE CdmxData SHALL asociar cada trámite con una CategoriaTramite.
3. THE CdmxData SHALL registrar para cada trámite el costo oficial en pesos mexicanos, la normatividad aplicable, los documentos requeridos, los pasos, la modalidad y el tiempo de resolución.
4. THE CdmxData SHALL registrar la dirección de la ventanilla o módulo de atención para cada una de las 16 alcaldías.
5. THE CdmxData SHALL tipar sus registros con los tipos del Contract.

### Requirement 3

**User Story:** Como ciudadano, quiero escribir mi duda como hablo, para obtener el trámite correcto sin conocer términos técnicos.

#### Acceptance Criteria

1. WHEN el AgentEngine recibe un AgentRequest, THE Normalizador SHALL convertir consultaCiudadana a minúsculas, sin acentos y con espacios simplificados.
2. WHEN la consulta contiene errores de dedo comunes o expresiones coloquiales chilangas, THE Normalizador SHALL asociar el texto con los términos del trámite correspondiente.
3. WHEN la consulta es "quiero abrir una cafetería y que no me clausuren", THE AgentEngine SHALL identificar el trámite de apertura de negocio de bajo impacto de SIAPEM.
4. WHEN el AgentRequest incluye categoria, THE AgentEngine SHALL restringir la búsqueda de trámite a esa CategoriaTramite.
5. WHEN el AgentEngine identifica trámite y alcaldia, THE AgentEngine SHALL ejecutar Herramientas_Locales sobre CdmxData y devolver un AgentResponse con el mismo id del AgentRequest y el campo ubicacionModuloAlcaldia de la alcaldia indicada.
6. IF la consulta no coincide con ningún trámite, THEN THE AgentEngine SHALL devolver un AgentResponse que indique en resumenCiudadano que no se encontró el trámite y sugiera reformular la consulta.
7. THE AgentEngine SHALL operar sin invocar ningún LLM ni servicio externo.

### Requirement 4

**User Story:** Como organizador de la demo, quiero tres casos de un clic, para presentar el producto en tres minutos.

#### Acceptance Criteria

1. THE DemoCases SHALL exportar exactamente 3 escenarios, cada uno con un AgentRequest válido.
2. WHEN el usuario pulsa el botón de un escenario, THE DashboardCiudadano SHALL enviar el AgentRequest del escenario al AgentEngine y mostrar el resultado sin pasos adicionales.

### Requirement 5

**User Story:** Como ciudadano, quiero una pantalla clara y accesible, para realizar mi trámite sin confusión.

#### Acceptance Criteria

1. THE DashboardCiudadano SHALL mostrar un selector con las 16 alcaldías de AlcaldiaCDMX.
2. THE DashboardCiudadano SHALL mostrar los botones de los casos de DemoCases.
3. THE DashboardCiudadano SHALL mostrar un chat donde el ciudadano escribe su consulta y el bot responde con el resumenCiudadano.
4. WHEN el AgentEngine devuelve un AgentResponse, THE DashboardCiudadano SHALL mostrar una lista de verificación interactiva con los documentosRequeridos que el usuario pueda marcar y desmarcar.
5. WHERE requiereLlaveCDMX es verdadero, THE DashboardCiudadano SHALL mostrar el distintivo "Llave CDMX".
6. WHEN el AgentEngine devuelve un AgentResponse, THE DashboardCiudadano SHALL mostrar una tarjeta de costo oficial con costoOficialMXN y alertaAnticorrupcion.
7. THE DashboardCiudadano SHALL mostrar los pasosAccion, tiempoResolucion, fundamentoNormativo, ubicacionModuloAlcaldia e impactoComunitario en lenguaje sin jerga técnica.
8. THE DashboardCiudadano SHALL proporcionar etiquetas de texto, navegación por teclado y contraste legible en todos los controles interactivos.
9. THE DashboardCiudadano SHALL mostrar todos los textos de interfaz en español.

### Requirement 6

**User Story:** Como desarrollador, quiero que la app arranque con un solo comando, para ejecutarla en la demo sin fricción.

#### Acceptance Criteria

1. WHEN se ejecuta `npm run dev`, THE TramiBot_App SHALL iniciar el servidor de desarrollo de Vite y renderizar App_Shell con DashboardCiudadano.
2. THE TramiBot_App SHALL usar Vite, React, TypeScript y TailwindCSS.

### Requirement 7

**User Story:** Como equipo, quiero publicar la base en el repositorio, para que los cuatro roles trabajen sobre el mismo código.

#### Acceptance Criteria

1. WHEN todas las demás tareas están completas, THE equipo SHALL ejecutar `git add -A && git commit -m "feat: tramibot cdmx base, spec y contrato para 4 roles" && git push origin main` como última tarea.

### Requirement 8: Chatbot conversacional con tarjetas interactivas

**User Story:** Como ciudadano, quiero conversar con el bot y recibir rutas, documentos y advertencias claras, para completar mi trámite sin coyotes.

#### Acceptance Criteria

1. THE Dashboard SHALL mostrar historial de mensajes usuario/agente, un indicador "Verificando fuentes oficiales .cdmx.gob.mx y reportes ciudadanos en Reddit/X..." mientras responde y un campo de entrada siempre visible.
2. THE respuesta SHALL incluir una ruta numerada de 3 pasos con botones a links oficiales `.cdmx.gob.mx`.
3. THE respuesta SHALL incluir un checklist interactivo con barra de progreso "Tienes X de Y requisitos listos para tu cita" y una tarjeta de radiografía callejera marcada como referencia ilustrativa.

### Requirement 9: Geolocalización y módulo más cercano

**User Story:** Como ciudadano, quiero saber qué módulo me queda más cerca, para ahorrar traslados.

#### Acceptance Criteria

1. THE cdmxData SHALL incluir latitud, longitud, dirección y horario para los módulos de las 16 alcaldías.
2. WHEN hay coordenadas, THE agentEngine SHALL calcular con Haversine la distancia en km y elegir el módulo más cercano.
3. IF el navegador bloquea el GPS o la ubicación está fuera de la CDMX, THEN THE Dashboard SHALL usar las coordenadas de UP Mixcoac (19.3733, -99.1834) y avisarlo.
4. THE respuesta SHALL mostrar distancia, dirección, horario y un botón "Abrir ubicación en Google Maps".

### Requirement 10: Auto-entrenamiento ciudadano

**User Story:** Como ciudadano, quiero enseñarle al bot lo que me pidieron en ventanilla, para que otros lo sepan.

#### Acceptance Criteria

1. WHEN el mensaje contiene una experiencia de fila (por ejemplo "te faltó decirme que...", "me pidieron también..."), THE agentEngine SHALL extraer el requisito y guardarlo en `localStorage` asociado al trámite.
2. THE bot SHALL responder con el mensaje de "Entrenamiento completado".
3. WHEN se consulta de nuevo ese trámite, THE respuesta SHALL incluir el requisito entre los documentos y en la sección "Aprendido de ciudadanos en fila", con un botón para borrar la memoria.

### Requirement 11: Búsqueda inteligente y LLM opcional

**User Story:** Como ciudadano, quiero escribir como hablo, para que el bot me entienda.

#### Acceptance Criteria

1. THE agentEngine SHALL normalizar acentos, modismos y tolerar errores de dedo.
2. WHERE exista `VITE_LLM_API_KEY`, THE agentEngine SHALL usar el LLM solo si el motor local no identifica el trámite, y SHALL conservar el resultado local si el LLM falla.

### Requirement 12: Demo de 3 minutos

**User Story:** Como presentador, quiero cuatro botones de un clic, para mostrar consulta, entrenamiento y verificación.

#### Acceptance Criteria

1. THE Dashboard SHALL mostrar 4 botones: licencia con módulo cercano, uso de suelo comercial, entrenar al bot y volver a consultar licencia.

