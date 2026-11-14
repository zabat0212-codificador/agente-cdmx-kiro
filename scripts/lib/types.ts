export type StepStatus = "succeeded" | "skipped" | "failed";

export interface StepResult {
  step: string; // e.g. "create-directories"
  status: StepStatus;
  detail?: string; // reason, error message, or manual command
}

export interface BootstrapOptions {
  root: string; // Workspace_Root
  eccSource: string; // path or URL, default DEFAULT_ECC_SOURCE
  remoteUrl?: string; // undefined => skip push
}

export const ROLE_FOLDERS = ["src/agent", "src/data", "src/components"] as const;
export const REQUIRED_DIRS = [...ROLE_FOLDERS, "src/types", ".kiro/steering"] as const;
export const REQUIRED_GITIGNORE = [
  "node_modules/",
  ".env",
  ".env.*",
  "dist/",
  "build/",
  ".DS_Store",
  "Thumbs.db",
] as const;

export const DEFAULT_ECC_SOURCE = "https://github.com/affaan-m/ECC.git";
/** Folders copied from the ECC repo; they live inside `.kiro/` in the source. */
export const ECC_COPY_DIRS = [".kiro/skills", ".kiro/agents"] as const;
export const DEFAULT_REMOTE_URL =
  "https://github.com/zabat0212-codificador/agente-cdmx-kiro.git";
export const DEFAULT_BRANCH = "main";
