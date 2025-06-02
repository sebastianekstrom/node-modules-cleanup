import { getDirectorySize } from "./getDirectorySize";
import { generatePrefix } from "../output/logger";

export const calculateSizeOfNodeModulesDirs = async ({
  nodeModulesDirs,
}: {
  nodeModulesDirs: string[];
}) => {
  // Calculate all sizes in parallel for maximum speed
  const sizePromises = nodeModulesDirs.map(async (nodeModulesDir, index) => {
    const dirSize = await getDirectorySize(nodeModulesDir);

    // Update progress during calculation
    process.stdout.write(
      `\r${generatePrefix("info")} Calculating sizes... (${index + 1}/${
        nodeModulesDirs.length
      })`,
    );

    return {
      path: nodeModulesDir,
      size: dirSize,
    };
  });

  const entries = await Promise.all(sizePromises);
  const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);

  // Clear the progress line
  process.stdout.write("\r" + " ".repeat(80) + "\r");

  return {
    entries,
    totalSize,
  };
};
