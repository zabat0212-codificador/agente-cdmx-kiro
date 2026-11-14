# Implementation Plan: TrámiBot CDMX

## Overview

Plan en TypeScript para construir la SPA Vite + React + TailwindCSS. Orden: instalación y configuración, contrato, datos (Rol 2), casos demo (Rol 4), motor (Rol 1), interfaz (Rol 3), verificación y, como última tarea, commit y push a `main`. Cada módulo importa sólo tipos de `src/types/contract.ts`. Las pruebas de propiedades usan `fast-check` (mínimo 100 iteraciones) con la etiqueta `Feature: tramibot-cdmx, Property N: <texto>`. Cada prueba va en su propio archivo para poder ejecutarse en paralelo.

## Tasks

- [x] 1. Instalar y configurar Vite + React + TypeScript + Tailwind
  - [x] 1.1 Instalar dependencias y actualizar scripts en `package.json`
    - Dependencias: `react`, `react-dom`
    - Dev: `vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `tailwindcss@3`, `postcss`, `autoprefixer`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
    - Conservar los scripts `bootstrap`, `test` (`vitest --run`) y `typecheck`; agregar `dev` (`vite`), `build` (`tsc --noEmit && vite build`) y `preview` (`vite preview`)
    - _Requirements: 6.1, 6.2_

  - [x] 1.2 Crear archivos de configuración y arranque
    - `index.html` con `<div id="root">`, `lang="es"` y script `/src/main.tsx`
    - `vite.config.ts` con `@vitejs/plugin-react`
    - `tailwind.config.js` (content: `./index.html`, `./src/**/*.{ts,tsx}`) y `postcss.config.js` (tailwindcss, autoprefixer); si `package.json` es `"type": "module"`, usar sintaxis ESM
    - `src/index.css` con las directivas `@tailwind base; @tailwind components; @tailwind utilities;`
    - `src/main.tsx` que monta `<App />` en `#root` e importa `./index.css`; crear un `src/App.tsx` provisional (se reemplaza en 7.2)
    - `tsconfig.json`: agregar `"jsx": "react-jsx"`, `lib: ["ES2022", "DOM", "DOM.Iterable"]`, y en `include` agregar `src/**/*.tsx`, `vite.config.ts` e `index.d.ts` si hace falta; mantener `types: ["node"]` y añadir `vitest/globals` sólo si se usan globals
    - `vitest.config.ts`: incluir `src/**/*.test.{ts,tsx}` y `scripts/**/*.test.ts`, agregar el plugin de React, `environment: "node"` por defecto (los tests de UI usan el docblock `// @vitest-environment jsdom`) y `setupFiles` con `src/test/setup.ts` (importa `@testing-library/jest-dom/vitest` y ejecuta `cleanup` tras cada prueba)
    - Verificar que las pruebas existentes de `scripts/` siguen pasando
    - _Requirements: 6.1, 6.2_

- [x] 2. Contrato compartido
  - [x] 2.1 Ampliar `src/types/contract.ts`
    - Conservar `AgentContract`, `DataContract` y `UiContract`
    - Agregar `AlcaldiaCDMX` (16 valores), `CategoriaTramite` (5 valores), `AgentRequest` y `AgentResponse` con `costoOficialMXN: string`, `modalidad` como unión de 3 valores e `impactoComunitario: { poblacionObjetivo: string; ahorroEstimado: string }`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 3. Base de datos de trámites (Rol 2)
  - [x] 3.1 Crear `src/data/cdmxData.ts`
    - Exportar `TramiteRecord`, `TRAMITES`, `MODULOS_ALCALDIA: Record<AlcaldiaCDMX, string>`, `ALCALDIAS` (16, orden alfabético) y `CATEGORIAS` (5)
    - Trámites: apertura de negocio de bajo impacto (SIAPEM), Licencia Tipo A, Tarjeta de Circulación, Certificado Único de Zonificación de Uso de Suelo, actas certificadas del Registro Civil y Reporte SUAC/Locatel
    - Cada trámite con `costoMXN` numérico, normatividad, documentos, pasos, modalidad, tiempo, alerta anticorrupción, impacto comunitario y `palabrasClave` ya normalizadas (incluir coloquialismos y errores de dedo: "chamba", "taqueria", "clausuren", "licensia", etc.)
    - Tipar todo con los tipos del contrato
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Escribir prueba de propiedad: categoría válida
    - Archivo `src/data/cdmxData.p1.test.ts`
    - **Property 1: Todo trámite tiene categoría válida**
    - **Validates: Requirements 2.2**

  - [ ]* 3.3 Escribir prueba de propiedad: datos completos y válidos
    - Archivo `src/data/cdmxData.p2.test.ts`
    - **Property 2: Todo trámite tiene datos completos y válidos**
    - **Validates: Requirements 2.3**

  - [ ]* 3.4 Escribir prueba de propiedad: módulo por alcaldía
    - Archivo `src/data/cdmxData.p3.test.ts`
    - **Property 3: Toda alcaldía tiene módulo de atención**
    - **Validates: Requirements 2.4**

- [x] 4. Casos de demostración (Rol 4)
  - [x] 4.1 Crear `src/data/demoCases.ts`
    - Exportar `DemoCase` y `DEMO_CASES` con exactamente 3 escenarios: cafetería ("quiero abrir una cafetería y que no me clausuren"), licencia de conducir y acta de nacimiento, cada uno con `AgentRequest` válido
    - _Requirements: 4.1_

  - [ ]* 4.2 Escribir pruebas unitarias de `DEMO_CASES`
    - Archivo `src/data/demoCases.test.ts`
    - Verificar que hay exactamente 3 casos y que cada alcaldía está en `ALCALDIAS`
    - _Requirements: 4.1_

- [x] 5. Motor del agente (Rol 1)
  - [x] 5.1 Crear `src/agent/agentEngine.ts`
    - Implementar `normalizar`, `buscarTramite`, `obtenerUbicacion`, `formatearCosto` y `procesarConsulta` según el algoritmo del diseño (puntuación por `palabrasClave`, empate por orden de `TRAMITES`)
    - Respuesta "Trámite no encontrado" para consulta sin coincidencia, vacía o categoría sin trámites; nunca lanza excepciones
    - Importar sólo de `cdmxData` y `contract`; sin `fetch`, `XMLHttpRequest` ni SDKs externos
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 5.2 Escribir prueba de propiedad: normalización
    - Archivo `src/agent/agentEngine.p4.test.ts`
    - **Property 4: Normalización correcta e idempotente**
    - **Validates: Requirements 3.1**

  - [ ]* 5.3 Escribir prueba de propiedad: variantes coloquiales
    - Archivo `src/agent/agentEngine.p5.test.ts`
    - **Property 5: Variantes coloquiales resuelven al trámite**
    - **Validates: Requirements 3.2**

  - [ ]* 5.4 Escribir prueba de propiedad: categoría restringe el trámite
    - Archivo `src/agent/agentEngine.p6.test.ts`
    - **Property 6: La categoría restringe el trámite**
    - **Validates: Requirements 3.4**

  - [ ]* 5.5 Escribir prueba de propiedad: id y ubicación
    - Archivo `src/agent/agentEngine.p7.test.ts`
    - **Property 7: La respuesta conserva el id y la ubicación de la alcaldía**
    - **Validates: Requirements 3.5**

  - [ ]* 5.6 Escribir prueba de propiedad: consultas sin coincidencia
    - Archivo `src/agent/agentEngine.p8.test.ts`
    - **Property 8: Consultas sin coincidencia sugieren reformular**
    - **Validates: Requirements 3.6**

  - [ ]* 5.7 Escribir prueba de propiedad: formato de costo
    - Archivo `src/agent/agentEngine.p12.test.ts`
    - **Property 12: El costo se formatea como texto MXN**
    - **Validates: Requirements 1.5, 2.3, 3.5, 5.6**

  - [ ]* 5.8 Escribir pruebas unitarias del motor
    - Archivo `src/agent/agentEngine.test.ts`
    - Consulta de la cafetería identifica la apertura de negocio de SIAPEM; existencia de los 6 trámites; consulta vacía devuelve "no encontrado"; los archivos de `src/agent` no contienen `fetch`, `XMLHttpRequest` ni imports de red
    - _Requirements: 2.1, 3.3, 3.6, 3.7_

- [~] 6. Checkpoint - Datos, casos demo y motor
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Interfaz de usuario (Rol 3)
  - [x] 7.1 Crear `src/components/DashboardCiudadano.tsx`
    - Estado local: `alcaldia`, `mensajes`, `respuesta`, `marcados`
    - Subcomponentes: `SelectorAlcaldia` (16 alcaldías), `BotonesDemo` (3 casos, un clic envía y muestra), `Chat` (`aria-live="polite"`, sin mensajes vacíos, botón deshabilitado si vacío), `ChecklistDocumentos` (checkboxes nativos), `DistintivoLlave` (sólo si `requiereLlaveCDMX`), `TarjetaCosto` (`costoOficialMXN` sin alterar y `alertaAnticorrupcion`), `DetalleTramite` (pasos, tiempo, fundamento, ubicación, impacto)
    - Al enviar: armar `AgentRequest`, llamar `procesarConsulta`, agregar `resumenCiudadano` al chat, guardar `respuesta` y reiniciar `marcados`
    - Accesibilidad: `<label>` por control, foco visible (`focus-visible:ring`), contraste mínimo 4.5:1, todos los textos en español
    - _Requirements: 4.2, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 7.2 Reemplazar `src/App.tsx` y verificar `src/main.tsx`
    - `App` renderiza `<DashboardCiudadano />`; `main.tsx` monta `App` en `#root` con `index.css`
    - _Requirements: 6.1, 6.2_

  - [ ]* 7.3 Escribir prueba de propiedad: alternar documento
    - Archivo `src/components/DashboardCiudadano.p9.test.tsx` (docblock `// @vitest-environment jsdom`)
    - **Property 9: Marcar dos veces un documento restaura el estado**
    - **Validates: Requirements 5.4**

  - [ ]* 7.4 Escribir prueba de propiedad: distintivo Llave CDMX
    - Archivo `src/components/DashboardCiudadano.p10.test.tsx` (jsdom)
    - **Property 10: El distintivo Llave CDMX refleja el campo**
    - **Validates: Requirements 5.5**

  - [ ]* 7.5 Escribir prueba de propiedad: campos de la respuesta visibles
    - Archivo `src/components/DashboardCiudadano.p11.test.tsx` (jsdom)
    - **Property 11: La interfaz muestra todos los campos de la respuesta**
    - **Validates: Requirements 5.6, 5.7**

  - [ ]* 7.6 Escribir pruebas unitarias de la interfaz
    - Archivo `src/components/DashboardCiudadano.test.tsx` (jsdom)
    - Selector con 16 alcaldías (5.1); 3 botones demo (5.2); clic en un caso demo muestra el resultado (4.2); etiquetas accesibles y chat con `aria-live` (5.8); textos en español (5.9)
    - _Requirements: 4.2, 5.1, 5.2, 5.8, 5.9_

- [x] 8. Verificación final
  - [x] 8.1 Ejecutar typecheck, pruebas y build
    - Correr `npm run typecheck`, `npm test` y `npm run build`; corregir cualquier falla hasta que los tres comandos terminen sin errores
    - _Requirements: 1.1, 6.1, 6.2_

- [ ] 9. Publicar en el repositorio (última tarea)
  - [-] 9.1 Commit y push a `main`
    - Ejecutar sólo cuando todas las demás tareas estén completas y 8.1 haya pasado: `git add -A && git commit -m "feat: tramibot cdmx base, spec y contrato para 4 roles" && git push origin main`
    - _Requirements: 7.1_

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Las pruebas de propiedades validan las propiedades de corrección del diseño; las unitarias validan ejemplos y casos límite
- La tarea 9.1 debe ser siempre la última; `.gitignore` debe excluir `node_modules` y `dist` antes del commit

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["3.1", "4.1"] },
    { "id": 4, "tasks": ["3.2", "3.3", "3.4", "4.2", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4", "7.5", "7.6"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["9.1"] }
  ]
}
```
