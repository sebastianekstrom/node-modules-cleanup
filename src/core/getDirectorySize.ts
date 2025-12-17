import * as fs from "node:fs";
import * as path from "node:path";

export async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function calculateSize(dir: string): Promise<void> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            await calculateSize(fullPath);
          } else {
            const stats = await fs.promises.stat(fullPath);
            totalSize += stats.size;
          }
        } catch {
          // Skip files/directories we can't access
        }
      }),
    );
  }

  try {
    await calculateSize(dirPath);
    return totalSize;
  } catch {
    return 0;
  }
}
