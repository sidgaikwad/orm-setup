import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeFileWithDir(
  path: string,
  content: string
): Promise<void> {
  // Ensure directory exists
  await mkdir(dirname(path), { recursive: true });

  // Write file
  await writeFile(path, content, "utf-8");
}

export async function writeMultipleFiles(
  files: Array<{ path: string; content: string }>
): Promise<void> {
  await Promise.all(
    files.map(({ path, content }) => writeFileWithDir(path, content))
  );
}
