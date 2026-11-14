import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

/** Writes content only if the path does not exist. Returns true when written. */
export function writeIfAbsent(path: string, content: string): boolean {
  if (existsSync(path) || isDanglingLink(path)) return false;
  mkdirSync(dirname(path), { recursive: true });
  try {
    // "wx" fails if the path appears between the check and the write.
    writeFileSync(path, content, { flag: "wx" });
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw err;
  }
}

/** mkdir -p. Never touches existing contents. */
export function ensureDir(path: string): void {
  mkdirSync(path, { recursive: true });
}

/**
 * Copies src tree into dest, skipping any file that already exists at dest.
 * Returned paths are relative to dest, using "/" separators.
 */
export function copyTreeNoOverwrite(
  src: string,
  dest: string,
): { copied: string[]; kept: string[] } {
  const copied: string[] = [];
  const kept: string[] = [];

  const walk = (srcDir: string, destDir: string, rel: string): void => {
    mkdirSync(destDir, { recursive: true });
    for (const name of readdirSync(srcDir)) {
      const s = join(srcDir, name);
      const d = join(destDir, name);
      const r = rel ? `${rel}/${name}` : name;
      const st = lstatSync(s);
      if (st.isDirectory()) {
        if (existsSync(d) && !lstatSync(d).isDirectory()) {
          kept.push(r);
          continue;
        }
        walk(s, d, r);
      } else if (st.isFile()) {
        if (existsSync(d) || isDanglingLink(d)) {
          kept.push(r);
        } else {
          copyFileSync(s, d, 1 /* COPYFILE_EXCL */);
          copied.push(r);
        }
      }
    }
  };

  walk(src, dest, "");
  return { copied, kept };
}

function isDanglingLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}
