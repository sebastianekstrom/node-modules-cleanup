import * as fs from "node:fs";
import { generatePrefix } from "../output/logger";

export interface Entry {
  path: string;
  size: number;
}

export const deleteMessage = (deletedFoldersCounter: number, entriesLength: number) => {
  return `\r${generatePrefix(
    "info",
  )} Deleting node_modules folders (${deletedFoldersCounter}/${
    entriesLength
  })...`;
};

export const deleteFolders = async (entries: Entry[]) => {
  let deletedFoldersCounter = 0;
  for (const entry of entries) {
    await fs.promises.rm(entry.path, { recursive: true });
    deletedFoldersCounter++;
    const message = deleteMessage(deletedFoldersCounter, entries.length);
    process.stdout.write(message);
  }
};
