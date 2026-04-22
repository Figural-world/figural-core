import fs from "node:fs/promises";
import path from "node:path";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const json = JSON.stringify(value, null, 2) + "\n";
  await fs.writeFile(filePath, json, "utf8");
}

export async function writeJsonFileIfMissing(filePath: string, value: unknown): Promise<void> {
  if (await pathExists(filePath)) return;
  await writeJsonFile(filePath, value);
}

