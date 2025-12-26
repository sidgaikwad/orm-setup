// src/file-writer.ts
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export async function writeFileWithDir(
  path: string,
  content: string
): Promise<void> {
  try {
    // Resolve to absolute path from current working directory
    const absolutePath = resolve(process.cwd(), path);
    const dir = dirname(absolutePath);

    // Ensure directory exists
    await mkdir(dir, { recursive: true });

    // Write file
    await writeFile(absolutePath, content, "utf-8");
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write file ${path}: ${error.message}`);
    }
    throw error;
  }
}

export async function writeMultipleFiles(
  files: Array<{ path: string; content: string }>
): Promise<void> {
  // Write files sequentially to avoid race conditions
  for (const { path, content } of files) {
    await writeFileWithDir(path, content);
  }
}
