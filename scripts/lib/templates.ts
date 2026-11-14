/** Contenido de src/types/contract.ts */
export const CONTRACT_TS = `// Fuente única de verdad para los tipos compartidos entre roles.
export interface AgentContract {
  id: string;
}

export interface DataContract {
  id: string;
}

export interface UiContract {
  id: string;
}
`;

/** Contenido de .kiro/steering/protocolo-equipo.md */
export const STEERING_ES = `# Protocolo del equipo

## Fuente única de verdad

\`src/types/contract.ts\` es la única fuente de verdad para los tipos compartidos entre roles.
Cualquier cambio en este archivo se avisa al equipo antes de hacer merge.

## Responsabilidades por rol

### Rol agente (\`src/agent\`)

Lógica del agente: prompts, herramientas y flujo de decisiones. Implementa los tipos de \`AgentContract\`.

### Rol datos (\`src/data\`)

Obtención, limpieza y acceso a los datos. Implementa los tipos de \`DataContract\`.

### Rol UI (\`src/components\`)

Componentes e interfaz de usuario. Consume los tipos de \`UiContract\`.

## Reglas básicas

- Trabaja solo en la carpeta de tu rol.
- Integra únicamente a través de los tipos de \`src/types/contract.ts\`.
- Haz commits pequeños y frecuentes a \`main\` o a ramas de corta duración.
`;
