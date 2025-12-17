import { getDirectorySize } from "./getDirectorySize";
import { generatePrefix } from "../output/logger";

export const calculateSizeOfNodeModulesDirs = async ({
  nodeModulesDirs,
}: {
  nodeModulesDirs: string[];
}) => {
  const CONCURRENT_SIZE_CHECKS = 10;
  const entries: Array<{ path: string; size: number }> = [];
  let processedCount = 0;

  // Process size calculations in batches to avoid overwhelming the system
  for (let i = 0; i < nodeModulesDirs.length; i += CONCURRENT_SIZE_CHECKS) {
    const batch = nodeModulesDirs.slice(i, i + CONCURRENT_SIZE_CHECKS);

    const batchResults = await Promise.all(
      batch.map(async (nodeModulesDir) => {
        const dirSize = await getDirectorySize(nodeModulesDir);
        processedCount++;

        // Update progress during calculation
        process.stdout.write(
          `\r${generatePrefix("info")} Calculating sizes... (${processedCount}/${nodeModulesDirs.length})`,
        );

        return {
          path: nodeModulesDir,
          size: dirSize,
        };
      }),
    );

    entries.push(...batchResults);
  }

  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

  // Clear the progress line
  process.stdout.write("\r" + " ".repeat(80) + "\r");

  return {
    entries,
    totalSize,
  };
};
