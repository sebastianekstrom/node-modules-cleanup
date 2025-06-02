import * as fs from "node:fs";
import { generatePrefix } from "../output/logger";

export interface Entry {
  path: string;
  size: number;
}

export const deleteMessage = (
  deletedFoldersCounter: number,
  entriesLength: number,
) => {
  return `\r${generatePrefix(
    "info",
  )} Deleting node_modules folders (${deletedFoldersCounter}/${entriesLength})...`;
};

// Parallel deletion with controlled concurrency
export const deleteFolders = async (entries: Entry[]) => {
  const CONCURRENT_DELETIONS = 5; // Limit concurrent deletions to avoid overwhelming the system
  let deletedFoldersCounter = 0;

  // Process deletions in batches
  for (let i = 0; i < entries.length; i += CONCURRENT_DELETIONS) {
    const batch = entries.slice(i, i + CONCURRENT_DELETIONS);

    const deletionPromises = batch.map(async (entry) => {
      await fs.promises.rm(entry.path, { recursive: true });
      deletedFoldersCounter++;
      const message = deleteMessage(deletedFoldersCounter, entries.length);
      process.stdout.write(message);
    });

    await Promise.all(deletionPromises);
  }
};
