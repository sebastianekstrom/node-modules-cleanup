import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export async function getDirectorySize(dirPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(`du -s "${dirPath}" | cut -f1`);
    const sizeInBlocks = parseInt(stdout.trim(), 10);
    const sizeInBytes = sizeInBlocks * 512;
    return sizeInBytes;
  } catch (err) {
    console.error(`Error calculating size for directory ${dirPath}:`, err);
    return 0;
  }
}
