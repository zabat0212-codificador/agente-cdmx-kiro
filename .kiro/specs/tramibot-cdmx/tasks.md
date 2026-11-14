# Implementation Plan: TrámiBot CDMX

## Overview

Plan en TypeScript para construir la SPA Vite + React + TailwindCSS. Orden: instalación y configuración, contrato, datos (Rol 2), casos demo (Rol 4), motor (Rol 1), interfaz (Rol 3), verificación y, como última tarea, commit y push a `main`. Cada módulo importa sólo tipos de `src/types/contract.ts`.

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

- [x] 4. Casos de demostración (Rol 4)
  - [x] 4.1 Crear `src/data/demoCases.ts`
    - Exportar `DemoCase` y `DEMO_CASES` con exactamente 3 escenarios: cafetería ("quiero abrir una cafetería y que no me clausuren"), licencia de conducir y acta de nacimiento, cada uno con `AgentRequest` válido
    - _Requirements: 4.1_

- [x] 5. Motor del agente (Rol 1)
  - [x] 5.1 Crear `src/agent/agentEngine.ts`
    - Implementar `normalizar`, `buscarTramite`, `obtenerUbicacion`, `formatearCosto` y `procesarConsulta` según el algoritmo del diseño (puntuación por `palabrasClave`, empate por orden de `TRAMITES`)
    - Respuesta "Trámite no encontrado" para consulta sin coincidencia, vacía o categoría sin trámites; nunca lanza excepciones
    - Importar sólo de `cdmxData` y `contract`; sin `fetch`, `XMLHttpRequest` ni SDKs externos
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 6. Checkpoint - Datos, casos demo y motor
  - Datos, casos demo y motor verificados con `tsc --noEmit`

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

- [x] 8. Verificación final
  - [x] 8.1 Ejecutar typecheck y build
    - Correr `npm run typecheck` y `npm run build`; ambos terminan sin errores
    - _Requirements: 1.1, 6.1, 6.2_

- [x] 9. Publicar en el repositorio (última tarea)
  - [x] 9.1 Commit y push a `main`
    - Ejecutar sólo cuando todas las demás tareas estén completas y 8.1 haya pasado: `git add -A && git commit -m "feat: tramibot cdmx base, spec y contrato para 4 roles" && git push origin main`
    - _Requirements: 7.1_

## Notes

- Cada tarea referencia requisitos específicos para trazabilidad
- La tarea 9.1 fue la última del plan base; `.gitignore` excluye `node_modules` y `dist`

## Iteración final end-to-end (demo ante jueces)

- [x] 10. Contrato ampliado
  - [x] 10.1 Agregar `Coordenadas`, `ModuloAtencion`, `ModuloCercano`, `PasoOficial`, `EnlaceOficial`, `RadiografiaCallejera` y campos opcionales en `AgentRequest`/`AgentResponse`
    - _Requirements: 8.1, 9.1_
- [x] 11. Datos oficiales y GPS
  - [x] 11.1 Coordenadas y horario de los 16 módulos en `cdmxData.ts`
    - _Requirements: 9.1_
  - [x] 11.2 Flujos con links `.cdmx.gob.mx` y radiografía callejera por trámite
    - _Requirements: 8.2, 8.3_
- [x] 12. Motor del agente
  - [x] 12.1 Haversine y módulo más cercano
    - _Requirements: 9.2_
  - [x] 12.2 Detección de entrenamiento ciudadano y memoria colectiva en `localStorage`
    - _Requirements: 10.1, 10.2, 10.3_
  - [x] 12.3 Normalizador con tolerancia a errores de dedo y LLM opcional con fallback local
    - _Requirements: 11.1, 11.2_
- [x] 13. Interfaz de chatbot institucional y 4 botones de demo
  - [x] 13.1 Chat, indicador de verificación, tarjetas (ruta, checklist con progreso, radiografía, memoria) y botón GPS
    - _Requirements: 8.1, 9.3, 12.1_
  - [x] 13.2 Cuatro casos de demo en `demoCases.ts`
    - _Requirements: 12.1_
- [x] 14. IA conversacional con RAG, Licencia Permanente y links oficiales
  - [x] 14.1 `generarRespuestaIA` (Gemini / Pollinations) con contexto de `cdmxData`, alcaldía y memoria colectiva
    - _Requirements: 11.2_
  - [x] 14.2 Licencia Permanente CDMX separada de la Tipo A de 3 años
    - _Requirements: 11.3_
  - [x] 14.3 URLs oficiales únicas y botón de Google Maps por módulo; botón de API Key en el header
    - _Requirements: 11.4_
- [x] 15. Catálogo masivo y explorador por categorías
  - [x] 15.1 Ficha completa de 10 trámites nuevos en `cdmxData.ts` con links oficiales y consejos de fila
    - _Requirements: 13.3_
  - [x] 15.2 Explorador de 5 categorías y sub-trámites; casos rápidos en acordeón; API key fuera de la interfaz
    - _Requirements: 13.1, 13.4, 13.5_
  - [x] 15.3 Selección directa de trámite en el motor y respuesta con IA + RAG
    - _Requirements: 13.2_
- [x] 16. Verificación y publicación
  - [x] 16.1 `npx tsc --noEmit` y `npm run build` sin errores
  - [x] 16.2 Commit y push a `origin/main`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1"] },
    { "id": 3, "tasks": ["3.1", "4.1"] },
    { "id": 4, "tasks": ["5.1"] },
    { "id": 5, "tasks": ["7.1"] },
    { "id": 6, "tasks": ["7.2"] },
    { "id": 7, "tasks": ["8.1"] },
    { "id": 8, "tasks": ["9.1"] }
  ]
}
```
