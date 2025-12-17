import * as fs from "fs";
import * as path from "path";

export async function findNodeModulesFolders(
  startPath: string,
): Promise<string[]> {
  const results: string[] = [];

  async function findNodeModulesRecursive(dir: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      const subdirPromises: Array<Promise<void>> = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          if (entry.name === "node_modules") {
            results.push(path.join(dir, entry.name));
            // Skip traversing inside node_modules - we found what we're looking for
          } else if (!entry.name.startsWith(".") || entry.name === ".") {
            // Process subdirectories in parallel for faster traversal
            subdirPromises.push(
              findNodeModulesRecursive(path.join(dir, entry.name)),
            );
          }
        }
      }

      await Promise.all(subdirPromises);
    } catch {
      // Skip directories we can't access (permissions, etc.) instead of crashing
      // This is common with system directories or permission-restricted folders
    }
  }

  await findNodeModulesRecursive(startPath);
  return results;
}
